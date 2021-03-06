const assert = require('assert');
const {ObjectId} = require('mongodb');

const paramParser = require('../index.js');

describe('Parameter Parser', function () {
    describe('Parse Object', function () {
        it('should  not change the object when no parameters specified', function () {
            assert.strictEqual(paramParser.parseObject(null, null), null, 'Null object does not return null');
            assert.deepStrictEqual(paramParser.parseObject({a: 1}, null), {a: 1}, 'No parameters changes the object');
        });

        it('should merge the parameters', function () {
            assert.deepStrictEqual(
                paramParser.parseObject(
                    {
                        val1: 'a',
                        val2: '@a',
                        val3: {
                            val4: '@c.d',
                        },
                        val5: '@xxx',
                    },
                    {
                        a: 1,
                        b: 2,
                        c: {
                            d: 4,
                        },
                    }
                ),
                {
                    val1: 'a',
                    val2: 1,
                    val3: {
                        val4: 4,
                    },
                    val5: '@xxx',
                },
                'Object is not parsed correctly'
            );
        });

        it('should merge the parameters with a different identifier', function () {
            assert.deepStrictEqual(
                paramParser.parseObject(
                    {
                        val1: 'a',
                        val2: '#a',
                        val3: {
                            val4: '#c.d',
                        },
                        val5: '#xxx',
                    },
                    {
                        a: 1,
                        b: 2,
                        c: {
                            d: 4,
                        },
                    },
                    {idCharacter: '#'}
                ),
                {
                    val1: 'a',
                    val2: 1,
                    val3: {
                        val4: 4,
                    },
                    val5: '#xxx',
                },
                'Object is not parsed correctly'
            );
        });

        it('should merge the parameters with a deep copy', function () {
            assert.deepStrictEqual(
                paramParser.parseObject(
                    {
                        val1: 'a',
                        val2: '#a',
                        val3: {
                            val4: '#c.d',
                        },
                        val5: '#xxx',
                    },
                    {
                        a: 1,
                        b: 2,
                        c: {
                            d: 4,
                        },
                    },
                    {idCharacter: '#', copy: true}
                ),
                {
                    val1: 'a',
                    val2: 1,
                    val3: {
                        val4: 4,
                    },
                    val5: '#xxx',
                },
                'Object is not parsed correctly'
            );
        });

        it('should merge the parameters with encoding', function () {
            assert.deepStrictEqual(
                paramParser.parseObject(
                    {
                        val1: 'a',
                        val2: '@a',
                        val3: {
                            val4: '@c.d',
                        },
                        val5: '@xxx',
                    },
                    {
                        a: 1,
                        b: 2,
                        c: {
                            d: 4,
                        },
                        xxx: '&34&',
                    },
                    {uriEncode: true}
                ),
                {
                    val1: 'a',
                    val2: 1,
                    val3: {
                        val4: 4,
                    },
                    val5: '%2634%26',
                },
                'Object is not parsed correctly'
            );
        });
    });

    describe('Parse String', function () {
        it('should  not change the string when no parameters specified', function () {
            assert.strictEqual(paramParser.parseString(null, null), null, 'Null string does not return null');
            assert.strictEqual(paramParser.parseString('abc', null), 'abc', 'No parameters changes the string');
        });

        it('should merge the parameters', function () {
            assert.strictEqual(
                paramParser.parseString('http://{a},{@a}/{@b}/b{@c.d}/{@xxx}}b}', {
                    a: 1,
                    b: 2,
                    c: {
                        d: 4,
                    },
                }),
                'http://{a},1/2/b4/{@xxx}}b}',
                'String is not parsed correctly'
            );
        });

        it('should merge the parameters with specified character', function () {
            assert.strictEqual(
                paramParser.parseString(
                    'http://{a},{#a}/{#b}/b{#c.d}/{#xxx}}b}',
                    {
                        a: 1,
                        b: 2,
                        c: {
                            d: 4,
                        },
                    },
                    '#'
                ),
                'http://{a},1/2/b4/{#xxx}}b}',
                'String is not parsed correctly'
            );
        });

        it('should not change dual brackets', function () {
            assert.strictEqual(
                paramParser.parseString('the value {{a}}', {
                    a: 1,
                }),
                'the value {{a}}',
                'String is not parsed correctly'
            );
        });

        it('should change a value between dual brackets', function () {
            assert.strictEqual(
                paramParser.parseString('the value {@a} & {@b}', {
                    a: 1,
                    b: 2,
                }),
                'the value 1 & 2',
                'String is not parsed correctly'
            );
        });

        it('should encode a value', function () {
            assert.strictEqual(
                paramParser.parseString(
                    'http://localhost:1234/test?date={#date}&date2=1',
                    {
                        date: '2017-04-11T23:59&&&&&&&:59+02:00',
                    },
                    {
                        idCharacter: '#',
                        uriEncode: true,
                    }
                ),
                'http://localhost:1234/test?date=2017-04-11T23%3A59%26%26%26%26%26%26%26%3A59%2B02%3A00&date2=1',
                'String is not parsed correctly'
            );
        });

        it('should not encode a value', function () {
            assert.strictEqual(
                paramParser.parseString(
                    'http://localhost:1234/test?date={#date}&date2=1',
                    {
                        date: '2017-04-11T23:59&&&&&&&:59+02:00',
                    },
                    {
                        idCharacter: '#',
                        uriEncode: false,
                    }
                ),
                'http://localhost:1234/test?date=2017-04-11T23:59&&&&&&&:59+02:00&date2=1',
                'String is not parsed correctly'
            );
        });
    });

    describe('Get Paramater Schema', function () {
        it('should  return an empty shcmea when no parameters specified', function () {
            assert.deepStrictEqual(
                paramParser.getParamaterSchema(null),
                {
                    type: 'object',
                    properties: {},
                },
                'Null parameters does not return empty schema'
            );
        });

        it('should generate an empty schema when no parameters are defined', function () {
            assert.deepStrictEqual(
                paramParser.getParamaterSchema({a: 1, b: 2, c: {d: 4}}),
                {type: 'object', properties: {}},
                'Parameter schema not generated correctly'
            );
        });

        it('should generate a schema with default types when no input schema is defined', function () {
            assert.deepStrictEqual(
                paramParser.getParamaterSchema({a: 1, b: '@val1', c: {d: '@val2.val3'}}),
                {
                    type: 'object',
                    properties: {
                        val1: {type: ['string', 'object', 'number', 'integer', 'boolean']},
                        val2: {
                            type: 'object',
                            properties: {
                                val3: {type: ['string', 'object', 'number', 'integer', 'boolean']},
                            },
                        },
                    },
                },
                'Parameter schema not generated correctly'
            );
        });

        it('should generate a schema with schema types', function () {
            assert.deepStrictEqual(
                paramParser.getParamaterSchema({a: 1, b: '@val1', c: {d: '@val2.val3'}}),
                {
                    type: 'object',
                    properties: {
                        val1: {type: ['string', 'object', 'number', 'integer', 'boolean']},
                        val2: {
                            type: 'object',
                            properties: {
                                val3: {type: ['string', 'object', 'number', 'integer', 'boolean']},
                            },
                        },
                    },
                },
                'Parameter schema not generated correctly'
            );
        });
    });

    describe('Parse', function () {
        it('should  not change the string when no parameters specified', function () {
            assert.strictEqual(paramParser.parse(), undefined, 'Null string does not return null');
            assert.strictEqual(paramParser.parse('abc', null), 'abc', 'No parameters changes the string');
        });

        it('should not merge an invalid type', function () {
            assert.strictEqual(
                paramParser.parse(123, {
                    a: 1,
                    b: 2,
                    c: {
                        d: 4,
                    },
                }),
                123,
                'Integer parsed'
            );
        });

        it('should merge a string', function () {
            assert.strictEqual(
                paramParser.parse('http://{a},{@a}/{@b}/b{@c.d}/{@xxx}}b/{@c.e}}', {
                    a: 1,
                    b: 2,
                    c: {
                        d: 4,
                        e: new ObjectId('5fe088832381ee343129d9c1'),
                    },
                }),
                'http://{a},1/2/b4/{@xxx}}b/5fe088832381ee343129d9c1}',
                'String is not parsed correctly'
            );
        });

        it('should merge a string object', function () {
            assert.strictEqual(
                paramParser.parse('@a', {
                    a: 1,
                    b: 2,
                    c: {
                        d: 4,
                    },
                }),
                1,
                'String is not parsed correctly'
            );
        });

        it('should merge the parameters', function () {
            assert.deepStrictEqual(
                paramParser.parse(
                    {
                        val1: 'a',
                        val2: '@a',
                        val3: {
                            val4: '@c.d',
                            val5: '@c.e',
                        },
                        val6: 'test {@b}',
                    },
                    {
                        a: 1,
                        b: 2,
                        c: {
                            d: 4,
                            e: new ObjectId('5fe088832381ee343129d9c1'),
                        },
                    }
                ),
                {
                    val1: 'a',
                    val2: 1,
                    val3: {
                        val4: 4,
                        val5: new ObjectId('5fe088832381ee343129d9c1'),
                    },
                    val6: 'test 2',
                },
                'Object is not parsed correctly'
            );
        });

        it('should merge and copy the parameters', function () {
            const parameters = paramParser.parse(
                {
                    val1: 'a',
                    val2: '@a',
                    val3: {
                        val4: '@c.d',
                        val5: new ObjectId('5fe088832381ee343129d9c1'),
                        val6: '@c.e',
                    },
                    val7: 'test {@b}',
                },
                {
                    a: 1,
                    b: 2,
                    c: {
                        d: 4,
                        e: new ObjectId('5fe088832381ee343129d9c2'),
                    },
                },
                {copy: true}
            );

            assert.deepStrictEqual(
                parameters,
                {
                    val1: 'a',
                    val2: 1,
                    val3: {
                        val4: 4,
                        val5: new ObjectId('5fe088832381ee343129d9c1'),
                        val6: new ObjectId('5fe088832381ee343129d9c2'),
                    },
                    val7: 'test 2',
                },
                'Object is not parsed correctly'
            );
        });
    });

    describe('Get Object Parameters', function () {
        it('should  return an empty object when no object specified', function () {
            assert.deepStrictEqual(paramParser.getObjectParameters(), {}, 'Null parameters did not return an empty object');
        });

        it('should get all applicable parameters for an object', function () {
            assert.deepStrictEqual(
                paramParser.getObjectParameters({
                    a: 1,
                    b: '@val1',
                    c: {d: '@val2.val3'},
                    e: '@val1.val4',
                }),
                {val1: ['', 'val4'], val2: ['val3']},
                'Parameters ott extracted correctly'
            );
        });

        it('should get all applicable parameters for an object with empty objects', function () {
            assert.deepStrictEqual(
                paramParser.getObjectParameters({
                    name: 'test',
                    steps: {},
                    parameters: {
                        properties: 'xxxx',
                    },
                }),
                {},
                'Parameters ott extracted corectly'
            );
        });

        it('should get all applicable parameters for a string', function () {
            assert.deepStrictEqual(
                paramParser.getObjectParameters('asdfg{@val6.val1} @@ot {@val1} @@ @}  x  {@val2.val4}'),
                {val1: [''], val2: ['val4'], val6: ['val1']},
                'Parameters not extracted correctly'
            );
        });

        it('should get all applicable parameters for a string with handlebars', function () {
            const params = paramParser.getObjectParameters(
                "H04{@Test.userCode}{{runInfo.shortYear}}{{runInfo.month}}{{runInfo.day}}{{runInfo.shortYear}}{{runInfo.month}}{{runInfo.day}}{{runInfo.shortYear}}{{runInfo.month}}{{runInfo.day}}{{runInfo.shortYear}}{{runInfo.month}}{{runInfo.day}}000001{{padLeft runInfo.nextSequence 4 '0'}}{@Test.serviceType}01\r\n"
            );
            assert.deepStrictEqual(params, {Test: ['userCode', 'serviceType']}, 'Parameters not extracted correctly');
        });

        it('should get all applicable parameters for a not string', function () {
            assert.deepStrictEqual(paramParser.getObjectParameters(1), {}, 'Parameters ott extracted correctly');
        });

        it('should get all applicable parameters for an object with strings', function () {
            assert.deepStrictEqual(
                paramParser.getObjectParameters({
                    a: 1,
                    b: '@val1',
                    c: {d: '@val2.val3'},
                    e: '@val1.val4',
                    f: 'asdfg{@val6.val1} @@ot {@val1} @@ @}  x  {@val2.val4}',
                }),
                {val1: ['', 'val4'], val2: ['val3', 'val4'], val6: ['val1']},

                'Parameters not extracted corectly'
            );
        });
    });

    describe('Get Parameter Paths', function () {
        it('should  return an empty array when no object specified', function () {
            assert.deepStrictEqual(paramParser.getParameterPaths(), [], 'Null parameters di not return an empty object');
        });

        it('should get all applicable parameters paths for an object', function () {
            assert.deepStrictEqual(
                paramParser.getParameterPaths({
                    a: 1,
                    b: '@val1',
                    c: {d: '@val2.val3'},
                    e: '@val1.val4',
                }),
                [
                    {from: '/val1', to: '/b', paramId: '@val1'},
                    {from: '/val2/val3', to: '/c/d', paramId: '@val2.val3'},
                    {from: '/val1/val4', to: '/e', paramId: '@val1.val4'},
                ],
                'Parameter paths not extracted correctly'
            );
        });

        it('should get all applicable parameters paths for an array', function () {
            assert.deepStrictEqual(
                paramParser.getParameterPaths([{a: '@val1'}, {a: {b: ['@val2', '@val3']}}]),
                [
                    {from: '/val1', to: '/0/a', paramId: '@val1'},
                    {from: '/val2', to: '/1/a/b/0', paramId: '@val2'},
                    {from: '/val3', to: '/1/a/b/1', paramId: '@val3'},
                ],
                'Parameter paths not extracted correctly'
            );
        });

        it('should get all applicable parameters paths for a string', function () {
            assert.deepStrictEqual(
                paramParser.getParameterPaths('@val1'),
                [{from: '/val1', to: '', paramId: '@val1'}],
                'Parameter paths not extracted correctly'
            );
        });
    });

    describe('Strip Values', function () {
        it('should return an empty object when no object specified', function () {
            assert.deepStrictEqual(paramParser.stripValues(), undefined, 'Null parameters di not return an empty object');
        });

        it('should strip all values from an object', function () {
            assert.deepStrictEqual(
                paramParser.stripValues({
                    a: 1,
                    b: ['1', 2, true, {val: {val2: 'a'}}],
                    c: {d: 'xyz'},
                    e: null,
                }),
                {
                    a: null,
                    b: [null, null, null, {val: {val2: null}}],
                    c: {d: null},
                    e: null,
                },
                'Values no stripped correctly'
            );
        });

        it('shouldstrip all values from an object and replace with another character', function () {
            assert.deepStrictEqual(
                paramParser.stripValues(
                    {
                        a: 1,
                        b: ['1', 2, true, {val: {val2: 'a'}}],
                        c: {d: 'xyz'},
                        e: null,
                    },
                    'xxx'
                ),
                {
                    a: 'xxx',
                    b: ['xxx', 'xxx', 'xxx', {val: {val2: 'xxx'}}],
                    c: {d: 'xxx'},
                    e: 'xxx',
                },
                'Values no stripped correctly'
            );
        });

        it('should return creplace char on literal value', function () {
            assert.deepStrictEqual(paramParser.stripValues('abc'), null, 'Values no stripped correctly');
        });

        it('should return creplace char on array value', function () {
            assert.deepStrictEqual(paramParser.stripValues(['a', 'b', 'c']), [null, null, null], 'Values no stripped correctly');
        });

        it('should return replace char on date value', function () {
            assert.deepStrictEqual(paramParser.stripValues(new Date()), null, 'Values no stripped correctly');
        });
        it('should return replace char on date object', function () {
            assert.deepStrictEqual(paramParser.stripValues({a: new Date()}), {a: null}, 'Values no stripped correctly');
        });

        it('should return replace char on date object on replacechar', function () {
            assert.deepStrictEqual(paramParser.stripValues({a: new Date()}, 'xxx'), {a: 'xxx'}, 'Values no stripped correctly');
        });
    });
});
