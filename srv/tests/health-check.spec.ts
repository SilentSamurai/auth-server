import {TestAppFixture} from "./test-app.fixture";

describe('e2e health-check', () => {
    let app: TestAppFixture;

    beforeAll(async () => {
        app = await new TestAppFixture().init();
    });

    afterAll(async () => {
        await app.close();
    });

    it(`/GET Health Check`, () => {
        return app.getHttpServer()
            .get('/api/v1/into/health-check')
            .expect(200)
            .expect({
                health: true
            });
    });
});

