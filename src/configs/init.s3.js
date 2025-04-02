'use strict';

const AWS = require('aws-sdk');
const config = require('./config.bucket');

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

    // Phương thức upload không còn là static nữa
    async upload(params) {
        return this.s3.upload(params).promise();
    }
}

// Export instance của S3 thay vì class để dễ sử dụng
const s3Instance = S3.getInstance();

module.exports = s3Instance;
