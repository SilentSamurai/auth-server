import {TestAppFixture} from "./test-app.fixture";

describe('e2e health-check', () => {
    let app: TestAppFixture;

    beforeAll(async () => {
        app = await new TestAppFixture().init();
    });

    afterAll(async () => {
        await app.close();
    });

    it(`/GET Health Check`, async () => {
        const mvc = await app.getHttpServer()
            .get('/api/v1/health-check');
        console.log(mvc.body);
        expect(mvc.status).toBe(200);
        expect(mvc.body).toBeDefined();
        expect(mvc.body).toHaveProperty('health');
        expect(mvc.body.health).toBe(true);
    });
});

