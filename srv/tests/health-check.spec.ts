import {TestAppFixture} from "./test-app.fixture";

describe('e2e health-check', () => {

    it(`/GET Health Check`, async () => {

        const app = await new TestAppFixture().init();

        const mvc = await app.getHttpServer()
            .get('/api/v1/health-check');
        console.log(mvc.body);
        expect(mvc.status).toBe(200);
        expect(mvc.body).toBeDefined();
        expect(mvc.body).toHaveProperty('health');
        expect(mvc.body.health).toBe(true);


        await app.close();
    });
});

