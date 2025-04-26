import { StaticModel } from './StaticModel';
import { DataModel } from './DataModel';
import {
    DataModelStatus,
    IQueryConfig,
    Query,
    SortConfig,
    ReturnedData,
    IDataModel,
} from './IDataModel';

describe('DataModel', () => {
    it('main test', async () => {
        const source = new StaticModel(['id'], []);
        const model = new DataModel(source);

        let response = await model.execute(new Query({ pageNo: 0 }));

        expect(response.data).toEqual([]);
    });
});
