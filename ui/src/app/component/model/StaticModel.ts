import { DataPushEvent, DataPushEventStatus} from "./DataModel";
import {BaseDataModel} from "./BaseDataModel";


export class StaticModel extends BaseDataModel {

    data: any[] = []
    private originalData: any[] = [];

    constructor(keyFields: string[]) {
        super(keyFields);
    }

    hasPage(pageNo: number): boolean {
        return pageNo == 0;
    }

    async apply(srcOptions: any): Promise<boolean> {
        // Apply sorting if orderBy is specified
        if (this.query.orderBy && this.query.orderBy.length > 0) {
            this.sortData();
        } else {
            // Reset to original data if no sorting
            this.data = [...this.originalData];
        }

        const event: DataPushEvent = {
            srcOptions: srcOptions,
            operation: DataPushEventStatus.UPDATED_DATA,
            data: this.data,
            pageNo: this.query.pageNo
        };
        this._dataPusher.emit(event)
        return true;
        // this.query = query;
    }

    getData(): any[] {
        return this.data;
    }

    appendData(data: any[]): void {
        this.originalData.push(...data);
        this.data.push(...data);
        this.apply({append: true});
    }

    setData(data: any[]): void {
        this.originalData = [...data];
        this.data = [...data];
        this.apply({append: false})
    }

    totalRowCount(): number {
        return this.data.length;
    }

    private sortData(): void {
        if (!this.query.orderBy || this.query.orderBy.length === 0) {
            return;
        }

        this.data.sort((a, b) => {
            for (const sort of this.query.orderBy) {
                const field = sort.field;
                const direction = sort.order === 'asc' ? 1 : -1;
                
                // Handle nested properties (e.g., "user.name")
                const aValue = this.getNestedValue(a, field);
                const bValue = this.getNestedValue(b, field);
                
                if (aValue === bValue) continue;
                
                // Handle different data types
                if (typeof aValue === 'string') {
                    return direction * aValue.localeCompare(bValue);
                }
                
                return direction * (aValue < bValue ? -1 : 1);
            }
            return 0;
        });
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => 
            current && current[key] !== undefined ? current[key] : null, obj);
    }
}

