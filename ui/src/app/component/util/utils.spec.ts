import {Util} from './utils';

describe('Test Util', function () {
    beforeEach(function () {});

    it('test path retrieval', function () {
        // Example usage:
        const jsonObj = {
            field1: {
                innerfield: [{attr: 'value1'}, {attr: 'value2'}],
            },
        };

        const value = Util.getValueFromPath(
            jsonObj,
            '/field1/innerfield/0/attr',
        );
        expect(value).toEqual('value1');

        const value2 = Util.getValueFromPath(
            jsonObj,
            '/field1/innerfield/1/attr',
        );
        expect(value2).toEqual('value2');
    });

    it('test path retrieval object', function () {
        // Example usage:
        const jsonObj = {
            a: {
                b: 'APPLE',
            },
        };

        const value = Util.getValueFromPath(jsonObj, '/a/b');
        expect(value).toEqual('APPLE');
    });

    it('test path retrieval object', function () {
        // Example usage:
        const jsonObj = [
            {
                a: {
                    b: 'APPLE',
                },
            },
        ];

        const value = Util.getValueFromPath(jsonObj, '/0/a/b');
        expect(value).toEqual('APPLE');
    });

    it('test path update object', function () {
        // Example usage:
        const jsonObj = [
            {
                a: {
                    b: 'APPLE',
                },
            },
        ];

        Util.updateValueAtPath(jsonObj, '/0/a/b', 'ball');
        expect(jsonObj[0].a.b).toEqual('ball');
    });
});
