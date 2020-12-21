'use strict';
const $check = require('check-types');
const $json = require('json-magic');
const cloneDeep = require('clone-deep');

class ParameterParser {
    static parse(obj, parameters, options) {
        if (!parameters) return obj;
        if (!obj) return obj;
        if (!options) options = {};
        options.idCharacter = options.idCharacter ? options.idCharacter : '@';

        function recurseObj(curObj) {
            for (const key in curObj) {
                if (!curObj.hasOwnProperty(key)) continue;
                const objVal = curObj[key];
                checkRecurse(objVal, curObj, key);
            }
        }

        function recurseArr(curArr) {
            for (let i = 0; i < curArr.length; i++) {
                checkRecurse(curArr[i], curArr, i);
            }
        }

        function checkRecurse(objVal, parentObj, parentKey) {
            if ($check.array(objVal)) {
                recurseArr(objVal);
            } else if ($check.object(objVal)) {
                recurseObj(objVal);
            } else if ($check.string(objVal)) {
                let strReplaceVal = objVal;
                if (objVal.startsWith(options.idCharacter)) {
                    const paramName = objVal.substring(1);
                    try {
                        strReplaceVal = $json.get(parameters, paramName);
                    } catch (exp) {
                        // ignore error
                    }
                } else {
                    strReplaceVal = ParameterParser.parseString(objVal, parameters, options.idCharacter);
                }
                if (parentObj && parentKey) {
                    parentObj[parentKey] = options.copy ? cloneDeep(strReplaceVal) : strReplaceVal;
                } else {
                    return strReplaceVal;
                }
            } else {
                return objVal;
            }
            return objVal;
        }

        const retVal = checkRecurse(obj);
        return retVal;
    }

    static stripValues(obj, replaceChar) {
        if (!obj) return obj;
        if (!replaceChar) replaceChar = null;

        if (!$check.array(obj) && !$check.object(obj)) return replaceChar;

        function checkRecurse(objVal, parentObj, parentKey) {
            if ($check.array(objVal)) {
                for (let i = 0; i < objVal.length; i++) {
                    checkRecurse(objVal[i], objVal, i);
                }
            } else if ($check.object(objVal)) {
                recurseObj(objVal);
            } else {
                parentObj[parentKey] = replaceChar;
            }
        }

        function recurseObj(curObj) {
            for (const key in curObj) {
                if (!curObj.hasOwnProperty(key)) continue;

                const objVal = curObj[key];

                checkRecurse(objVal, curObj, key);
            }
        }

        checkRecurse(obj, null, null);

        return obj;
    }

    static getParameterPaths(obj, idCharacter) {
        const paramPaths = [];
        if (!obj) return paramPaths;
        if (!idCharacter) idCharacter = '@';

        function checkRecurse(objVal, parentObj, parentKey, curPath) {
            if ($check.array(objVal)) {
                for (let i = 0; i < objVal.length; i++) {
                    checkRecurse(objVal[i], objVal, i, curPath + '/' + i);
                }
            } else if ($check.object(objVal)) {
                recurseObj(objVal, curPath);
            } else if ($check.string(objVal)) {
                if (objVal.startsWith(idCharacter)) {
                    const paramName = objVal.substring(1);
                    paramPaths.push({
                        from: '/' + paramName.replace(/\./g, '/'),
                        to: curPath,
                        paramId: idCharacter + paramName,
                    });
                }
            } else {
                // dont do anything
            }
        }

        function recurseObj(curObj, curPath) {
            for (const key in curObj) {
                if (!curObj.hasOwnProperty(key)) continue;

                const objVal = curObj[key];

                checkRecurse(objVal, curObj, key, curPath + '/' + key);
            }
        }

        checkRecurse(obj, null, null, '');

        return paramPaths;
    }

    static getObjectParameters(obj, idCharacter) {
        const requiredParams = {};
        if (!obj) return requiredParams;
        if (!idCharacter) idCharacter = '@';

        const paramPaths = [];
        const regEx = new RegExp('{' + idCharacter + '([^}]+)}', 'g');

        function checkRecurse(objVal, parentObj, parentKey) {
            if ($check.array(objVal)) {
                for (let i = 0; i < objVal.length; i++) {
                    checkRecurse(objVal[i], objVal, i);
                }
            } else if ($check.object(objVal)) {
                recurseObj(objVal);
            } else if ($check.string(objVal)) {
                if (objVal.startsWith(idCharacter)) {
                    const paramName = objVal.substring(1);
                    paramPaths.push(paramName);
                } else {
                    const matches = objVal.match(regEx);
                    if (matches) {
                        for (const match of matches) {
                            const paramName = match.substring(2, match.length - 1);
                            paramPaths.push(paramName);
                        }
                    }
                }
            } else {
                // dont do anything
            }
        }

        function recurseObj(curObj) {
            for (const key in curObj) {
                if (!curObj.hasOwnProperty(key)) continue;

                const objVal = curObj[key];

                checkRecurse(objVal, curObj, key);
            }
        }

        checkRecurse(obj, null, null);

        for (const paramPath of paramPaths) {
            const paramPathArr = paramPath.split('.');
            const paramName = paramPathArr.shift();
            if (!requiredParams[paramName]) requiredParams[paramName] = [];
            const pathForParam = paramPathArr.join('.');
            if (requiredParams[paramName].indexOf(pathForParam) < 0) requiredParams[paramName].push(pathForParam);
        }

        return requiredParams;
    }

    static getParamaterSchema(obj, idCharacter) {
        const paramSchema = {type: 'object', properties: {}};
        if (!obj) return paramSchema;
        if (!idCharacter) idCharacter = '@';

        const paramPaths = [];
        const defaultType = ['string', 'object', 'number', 'integer', 'boolean'];

        function checkRecurse(objVal, parentObj, parentKey) {
            if ($check.array(objVal)) {
                for (let i = 0; i < objVal.length; i++) {
                    checkRecurse(objVal[i], objVal, i);
                }
            } else if ($check.object(objVal)) {
                recurseObj(objVal);
            } else if ($check.string(objVal)) {
                if (objVal.startsWith(idCharacter)) {
                    const paramName = objVal.substring(1);
                    paramPaths.push(paramName);
                }
            } else {
                // dont do anything
            }
        }

        function recurseObj(curObj) {
            for (const key in curObj) {
                if (!curObj.hasOwnProperty(key)) continue;

                const objVal = curObj[key];

                checkRecurse(objVal, curObj, key);
            }
        }

        recurseObj(obj);

        for (const paramPath of paramPaths) {
            const paramPathArr = paramPath.split('.');
            const schemaPathArr = [];
            for (const paramPathArrVal of paramPathArr) {
                $json.set(paramSchema, schemaPathArr.concat('type'), 'object');
                schemaPathArr.push('properties');
                schemaPathArr.push(paramPathArrVal);
            }
            $json.set(paramSchema, schemaPathArr, {type: defaultType});
        }

        return paramSchema;
    }

    static parseString(string, parameters, idCharacter) {
        if (!string) return string;

        let options = {};
        if (idCharacter && $check.string(idCharacter)) {
            options.idCharacter = idCharacter;
        } else if (idCharacter && $check.object(idCharacter)) {
            options = idCharacter;
        }

        if (!options.idCharacter) options.idCharacter = '@';

        const regEx = new RegExp('{{|}}|{' + options.idCharacter + '([^}]+)}', 'g');
        return string.replace(regEx, function (m, n) {
            if (!n) {
                return m;
            }
            if (m == '{{') {
                // return '{';
            }
            if (m == '}}') {
                // return '}';
            }
            const paramName = n;
            let paramVal = null;
            try {
                paramVal = $json.get(parameters, paramName);
            } catch (exp) {
                // ignore error
            }

            if ($check.assigned(paramVal)) {
                if (options.uriEncode) paramVal = encodeURIComponent(paramVal);
                return paramVal;
            } else return m;
        });
    }

    static parseObject(obj, parameters, options) {
        if (!parameters) return obj;
        if (!obj) return obj;
        if (!options) options = {};
        if (!options.idCharacter) options.idCharacter = '@';

        function checkRecurse(objVal, parentObj, parentKey) {
            if ($check.array(objVal)) {
                for (let i = 0; i < objVal.length; i++) {
                    checkRecurse(objVal[i], objVal, i);
                }
            } else if ($check.object(objVal)) {
                recurseObj(objVal);
            } else if ($check.string(objVal)) {
                if (objVal.startsWith(options.idCharacter)) {
                    const paramName = objVal.substring(1);
                    let paramVal = null;
                    try {
                        paramVal = $json.get(parameters, paramName);
                    } catch (exp) {
                        // ignore error
                    }

                    if ($check.assigned(paramVal)) {
                        let reworkedVal = options.copy ? cloneDeep(paramVal) : paramVal;
                        if ($check.string(reworkedVal) && options.uriEncode) reworkedVal = encodeURIComponent(reworkedVal);
                        parentObj[parentKey] = reworkedVal;
                    }
                }
            } else {
                // dont do anything
            }
        }

        function recurseObj(curObj) {
            for (const key in curObj) {
                if (!curObj.hasOwnProperty(key)) continue;

                const objVal = curObj[key];

                checkRecurse(objVal, curObj, key);
            }
        }

        recurseObj(obj);

        return obj;
    }
}

module.exports = ParameterParser;
