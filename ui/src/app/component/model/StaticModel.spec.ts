import { StaticModel } from "./StaticModel";
import { Query } from "./DataModel";
import { Filter } from "./Filters";
import { Operators } from "./Operator";

describe('StaticModel', () => {

    // Constructor initializes with empty data array when no arguments provided
    it('should initialize with empty data array when no arguments provided', async () => {
        // Provide keyFields as the first argument
        const model = new StaticModel(['id']);

        // Provide an empty config object to the Query constructor
        const result = await model.fetchData(new Query({}));

        expect(result.data).toEqual([]);
        expect(result.count).toBe(0);
    });

    // Constructor initializes with provided data array when argument is provided
    it('should initialize with provided data array when argument is provided', async () => {
        const initialData = [{ id: 1, name: 'Test' }, { id: 2, name: 'Test2' }];
        // Provide keyFields first, then initialData
        const model = new StaticModel(['id'], initialData);

        // Provide an empty config object to the Query constructor
        const result = await model.fetchData(new Query({}));

        expect(result.data).toEqual(initialData);
        expect(result.count).toBe(initialData.length);
    });

    // setData replaces existing data with new data array
    it('should replace existing data with new data array when setData is called', async () => {
        const initialData = [{ id: 1, name: 'Test' }];
        const newData = [{ id: 2, name: 'New' }, { id: 3, name: 'New2' }];
        // Provide keyFields first, then initialData
        const model = new StaticModel(['id'], initialData);

        model.setData(newData);
        // Provide an empty config object to the Query constructor
        const result = await model.fetchData(new Query({}));

        expect(result.data).toEqual(newData);
        expect(result.count).toBe(newData.length);
    });

    // appendData adds new items to the existing data array
    it('should add new items to existing data array when appendData is called', async () => {
        const initialData = [{ id: 1, name: 'Test' }];
        const additionalData = [{ id: 2, name: 'Additional' }];
        // Provide keyFields first, then initialData
        const model = new StaticModel(['id'], initialData);

        model.appendData(additionalData);
        // Provide an empty config object to the Query constructor
        const result = await model.fetchData(new Query({}));

        expect(result.data).toEqual([...initialData, ...additionalData]);
        expect(result.count).toBe(initialData.length + additionalData.length);
    });

    // fetchData returns paginated data based on query parameters
    it('should return paginated data based on query parameters', async () => {
        const data = [
            { id: 1, name: 'A' },
            { id: 2, name: 'B' },
            { id: 3, name: 'C' },
            { id: 4, name: 'D' },
            { id: 5, name: 'E' }
        ];
        // Provide keyFields first, then initialData
        const model = new StaticModel(['id'], data);

        // Provide config object to the Query constructor
        const query = new Query({ pageNo: 1, pageSize: 2 });

        const result = await model.fetchData(query);

        expect(result.data).toEqual([{ id: 3, name: 'C' }, { id: 4, name: 'D' }]);
        expect(result.count).toBe(2);
    });

    // fetchData applies filters correctly to the data
    it('should apply filters correctly to the data', async () => {
        const data = [
            { id: 1, name: 'Test1' },
            { id: 2, name: 'Test2' },
            { id: 3, name: 'Different' }
        ];
        // Provide keyFields first, then initialData
        const model = new StaticModel(['id'], data);

        // Provide config object to the Query constructor
        const query = new Query({
            filters: [new Filter('name', 'Name', 'Test', Operators.CONTAINS)]
        });

        const result = await model.fetchData(query);

        expect(result.data).toEqual([{ id: 1, name: 'Test1' }, { id: 2, name: 'Test2' }]);
        expect(result.count).toBe(2);
    });

    // fetchData handles empty data array
    it('should handle empty data array when fetching data', async () => {
        // Provide keyFields first, then initialData (empty array)
        const model = new StaticModel(['id'], []);

        // Provide config object to the Query constructor
        const query = new Query({ pageNo: 0, pageSize: 10 });

        const result = await model.fetchData(query);

        expect(result.data).toEqual([]);
        expect(result.count).toBe(0);
    });

    // fetchData handles null or undefined query parameters (within the config object)
    it('should handle null or undefined query parameters', async () => {
        const data = [{ id: 1, name: 'Test' }, { id: 2, name: 'Test2' }];
        // Provide keyFields first, then initialData
        const model = new StaticModel(['id'], data);

        // Pass null/undefined within the config object
        const query = new Query({ pageNo: null as any, pageSize: undefined as any });

        const result = await model.fetchData(query);

        // Expect default behavior (page 0, full data size)
        expect(result.data).toEqual(data);
        expect(result.count).toBe(data.length);
    });

    // fetchData handles empty filters array
    it('should handle empty filters array', async () => {
        const data = [{ id: 1, name: 'Test' }, { id: 2, name: 'Test2' }];
        // Provide keyFields first, then initialData
        const model = new StaticModel(['id'], data);

        // Provide config object with empty filters array
        const query = new Query({ filters: [] });

        const result = await model.fetchData(query);

        expect(result.data).toEqual(data);
        expect(result.count).toBe(data.length);
    });

    // fetchData handles empty orderBy array
    it('should handle empty orderBy array', async () => {
        const data = [{ id: 1, name: 'Test' }, { id: 2, name: 'Test2' }];
        // Provide keyFields first, then initialData
        const model = new StaticModel(['id'], data);

        // Provide config object with empty orderBy array
        const query = new Query({ orderBy: [] });

        const result = await model.fetchData(query);

        expect(result.data).toEqual(data);
        expect(result.count).toBe(data.length);
    });

    // getNestedValue handles nested properties correctly
    it('should handle nested properties correctly in filtering', async () => {
        const data = [
            { id: 1, user: { name: 'Alice', age: 30 } },
            { id: 2, user: { name: 'Bob', age: 25 } },
            { id: 3, user: { name: 'Charlie', age: 35 } }
        ];
        // Provide keyFields first, then initialData
        const model = new StaticModel(['id'], data);

        // Provide config object with filter for nested property
        const query = new Query({
            filters: [new Filter('user.age', 'Age', '30', Operators.EQ)]
        });

        const result = await model.fetchData(query);

        expect(result.data).toEqual([{ id: 1, user: { name: 'Alice', age: 30 } }]);
        expect(result.count).toBe(1);
    });

    // getNestedValue returns null for non-existent properties
    it('should return null for non-existent properties in filtering', async () => {
        const data = [
            { id: 1, name: 'Test1' },
            { id: 2, name: 'Test2' }
        ];
        // Provide keyFields first, then initialData
        const model = new StaticModel(['id'], data);

        // Provide config object with filter for non-existent property
        const query = new Query({
            filters: [new Filter('nonExistent', 'NonExistent', 'value', Operators.EQ)]
        });

        const result = await model.fetchData(query);

        // Expect empty result as the filter condition (null === 'value') is false
        expect(result.data).toEqual([]);
        expect(result.count).toBe(0);
    });
});
