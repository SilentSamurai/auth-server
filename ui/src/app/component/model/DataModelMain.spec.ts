import { StaticModel } from './StaticModel';
import { DataModelImpl } from './DataModelImpl';
import {
    DataModelStatus,
    IQuery,
    Query,
    SortConfig,
    ReturnedData,
    DataModel,
} from './DataModel';

describe('DataModel', () => {
    it('main test', async () => {
        const source = new StaticModel(['id'], []);
        const model = new DataModelImpl(source);

        let response = await model.execute(new Query({ pageNo: 0 }));

        expect(response.data).toEqual([]);
    });
});
