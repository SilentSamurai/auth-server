import {StaticModel} from './StaticModel';
import {DataModelImpl} from './DataModelImpl';
import {Filter} from './Filters';
import {Operators} from './Operator';
import {DataModelStatus, IQuery, Query, SortConfig, ReturnedData, DataModel} from './DataModel';
import {HttpClient} from "@angular/common/http";
import {RestApiModel} from "./RestApiModel";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {TestBed} from "@angular/core/testing";

describe('DataModel', () => {


    it('main test', async () => {
        const source = new StaticModel(["id"], []);
        const model = new DataModelImpl(source);

        let response = await model.execute(new Query({pageNo: 0}));

        expect(response.data).toEqual([]);

    });
});
