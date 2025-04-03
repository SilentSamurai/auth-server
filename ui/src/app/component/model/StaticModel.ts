import { DataPushEvent, DataPushEventStatus} from "./DataModel";
import {BaseDataModel} from "./BaseDataModel";


export class StaticModel extends BaseDataModel {

    data: any[] = []

    constructor(keyFields: string[]) {
        super(keyFields);
    }

    hasPage(pageNo: number): boolean {
        return pageNo == 0;
    }

    async apply(srcOptions: any): Promise<boolean> {
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
        this.data.push(...data);
        this.apply({append: true});
    }

    setData(data: any[]): void {
        this.data = [...data];
        this.apply({append: false})
    }

    totalRowCount(): number {
        return this.data.length;
    }


}

