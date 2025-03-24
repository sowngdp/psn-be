'use strict';

const AWS = require('aws-sdk');
const config = require('../configs/config.bucket');


// sử dụng singleton pattern giống như connection mongodb
// nếu đã có s3 thì k cần tạo mới nữa

class S3 {
    constructor() {
        if (!AWS.config.credentials) {
            AWS.config.update({
                accessKeyId: config.bucket.accessKeyId,
                secretAccessKey: config.bucket.secretAccessKey,
            });
        }
        this.s3 = new AWS.S3({
            region: config.bucket.region,
        });
    }

    static getInstance() {
        if (!S3.instance) {
            S3.instance = new S3();
        }
        return S3.instance;
    }

    // Remove 'static' from here
    async upload(params) {
        return this.s3.upload(params).promise();
    }
}

const instanceS3 = S3.getInstance();
module.exports = instanceS3;