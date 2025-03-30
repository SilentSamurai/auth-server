import {TestAppFixture} from "../test-app.fixture";
import {expect2xx, HttpClient} from "./client";


export class SearchClient extends HttpClient {

    constructor(app: TestAppFixture, accessToken: string) {
        super(app, accessToken);
    }

    private convertToCriteria(query: any) {
        const searchCriteria = [];
        for (let key in query) {
            searchCriteria.push({
                name: key,
                label: key,
                value: query[key],
                operator: "equals"
            })
        }
        return searchCriteria;
    }

    public async findByTenant(query: any) {
        let where = this.convertToCriteria(query);
        const response = await this.post('/api/search/Tenants')
            .send({
                pageNo: 0,
                pageSize: 50,
                where: where
            });

        console.log(response.body);
        expect2xx(response);
        expect(response.body.data.length).toBeGreaterThanOrEqual(1);
        return response.body.data[0];
    }
}
