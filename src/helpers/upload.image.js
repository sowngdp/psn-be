'use strict';


const AWS = require('aws-sdk');
const config = require('../configs/config.bucket');
const s3 = require('../dbs/init.s3');


class ImageService {
    static async uploadImages(files) {
        const uploadPromises = files.map((file) => {
            const params = {
                Bucket: config.bucket.name,
                Key: `images/${Date.now()}_${file.originalname}`,
                Body: file.buffer,
                ContentType: file.mimetype,
                // ACL: 'public-read',
            };
            // Call s3.upload(params) without .promise()
            return s3.upload(params);
        });

        const uploadResults = await Promise.all(uploadPromises);
        const imageUrls = uploadResults.map((result) => result.Location);
        return imageUrls;
    }

    static async uploadImage(file) {
        const params = {
            Bucket: config.bucket.name,
            Key: `images/${Date.now()}_${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
            // ACL: 'public-read',
        };
        // Call s3.upload(params) without .promise()
        const result = await s3.upload(params);
        return result.Location;
    }
}

module.exports = ImageService;


/*
const express = require("express");
const { initializeApp } = require("firebase/app");
const { getStorage, ref, uploadBytes, getDownloadURL } = require("firebase/storage");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
*/