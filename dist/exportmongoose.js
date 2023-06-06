"use strict";
const mongoose = require('mongoose');
// import { convert, register } from 'mongoose-jsonschema-validation';
const customTypeSchema = {
    type: 'object',
    properties: {
        value: { type: 'string' },
    },
};
// register('MyCustomType', customTypeSchema);
const jsonObject = {
    field1: { value: 'Custom Value' },
    // ...
};
const schema = {
    type: 'object',
    properties: {
        field1: { $ref: 'MyCustomType' },
        // ...
    },
};
// const YourModel = convert(mongoose, schema);
// const instance = new YourModel(jsonObject);
// console.log(instance.field1);
