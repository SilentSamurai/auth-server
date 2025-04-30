import {StaticSource} from './StaticSource';
import {DataModel} from './DataModel';
import {Query} from "./Query";

describe('DataModel', () => {
    it('main test', async () => {
        const source = new StaticSource(['id'], []);
        const model = new DataModel(source);

        let response = await model.execute(new Query({pageNo: 0}));

        expect(response.data).toEqual([]);
    });
});
