import {DataPushEventStatus, SortConfig} from "./DataModel";
import {BaseDataModel} from "./BaseDataModel";


export class StaticModel<T> extends BaseDataModel<T> {
    protected override data: T[] = [];
    private originalData: T[] = [];

    constructor(keyFields: string[]) {
        super(keyFields);
    }

    override hasPage(pageNo: number): boolean {
        return pageNo === 0;
    }

    // override orderBy(orderBy: any[]) {
    //     super.orderBy(orderBy);
    //     this.apply({});
    // }

    override async apply(srcOptions: any): Promise<boolean> {
        try {
            // Apply sorting if orderBy is specified
            if (this.getOrderBy() && this.getOrderBy().length > 0) {
                await this.sortData();
            } else {
                // Reset to original data if no sorting
                this.data = [...this.originalData];
            }

            this.emitDataEvent({
                operation: DataPushEventStatus.UPDATED_DATA,
                data: this.data,
                pageNo: this.query.pageNo,
                srcOptions
            });
            return true;
        } catch (error) {
            this.emitDataEvent({
                operation: DataPushEventStatus.UPDATED_DATA,
                pageNo: this.query.pageNo,
                error: error instanceof Error ? error : new Error(String(error)),
                srcOptions
            });
            return false;
        } finally {

        }
    }

    override getData(): T[] {
        return this.data;
    }

    appendData(newData: T[]): void {
        this.originalData.push(...newData);
        this.data.push(...newData);
        this.apply({append: true});
    }

    setData(newData: T[]): void {
        this.originalData = [...newData];
        this.data = [...newData];
        this.apply({append: false});
    }

    override totalRowCount(): number {
        return this.originalData.length;
    }

    private async sortData(): Promise<void> {
        if (!this.getOrderBy() || this.getOrderBy().length === 0) {
            return;
        }

        // Create a new array for sorting to avoid mutating original
        const sortedData = [...this.originalData];

        sortedData.sort((a, b) => {
            for (const sort of this.getOrderBy()) {
                const field = sort.field;
                const direction = sort.order === 'asc' ? 1 : -1;

                const aValue = this.getNestedValue(a, field);
                const bValue = this.getNestedValue(b, field);

                if (aValue === bValue) continue;

                if (aValue === null || aValue === undefined) return direction;
                if (bValue === null || bValue === undefined) return -direction;

                if (typeof aValue === 'string') {
                    return direction * aValue.localeCompare(bValue);
                }

                return direction * (aValue < bValue ? -1 : 1);
            }
            return 0;
        });

        this.data = sortedData;
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) =>
            current && current[key] !== undefined ? current[key] : null, obj);
    }
}

