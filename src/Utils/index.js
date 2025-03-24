'use strict';

const _ = require('lodash');
const { Types } = require('mongoose');


const convertStringToObjectIdMongoDb = str => new Types.ObjectId(str);

const getInfoData = ({ fields = [], object = {} }) => {
  return fields.reduce((obj, field) => {
    if (object && object.hasOwnProperty(field)) {
      obj[field] = object[field];
    }
    return obj;
  }, {});
};

const getSelectData = (select = []) => {
    return Object.fromEntries(select.map(el => [el , 1]));
};

const getUnselectData = (select = []) => {
    return Object.fromEntries(select.map(el => [el , 0]));
};

const removeUndefinedObject = obj => {
    Object.keys(obj).forEach(k => {
        if(obj[k] === null) {
            delete obj[k]
        };
    });

    return obj;
};

const updateNestedObjectParser = obj => {
    const final = {};
    Object.keys(obj || {}).forEach(k => {
        if (typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
            const res = updateNestedObjectParser(obj[k]);
            Object.keys(res || {}).forEach(a => {
                final[`${k}.${a}`] = res[a];
            })
        } else {
            final[k] = obj[k];
        }
    })
    return final;
}

module.exports = {
    getInfoData,
    getSelectData,
    getUnselectData,
    removeUndefinedObject,
    updateNestedObjectParser,
    convertStringToObjectIdMongoDb
};