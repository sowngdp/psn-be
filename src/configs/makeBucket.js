'use strict';

const AWS = require('aws-sdk');
const { bucket: { name, region, accessKeyId, secretAccessKey } } = require('./config.bucket');
const s3Instance = require('./init.s3');

// Kiểm tra xem tên bucket có được lấy đúng không
console.log("Bucket name:", name);

AWS.config.update({
    region,
    accessKeyId,
    secretAccessKey
});

var s3 = new AWS.S3();

// Hàm chỉnh sửa cấu hình CORS cho bucket
const editBucketCORS = () =>
  s3Instance.s3.putBucketCors(
    {
      Bucket: name,  // Chỉ định bucket từ file cấu hình
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],  // Cho phép tất cả các headers
            AllowedMethods: ["PUT", "POST", "DELETE"], // Các phương thức được phép
            AllowedOrigins: ["*"], // Cho phép tất cả các origin
          },
          {
            AllowedMethods: ["GET"], // Chỉ cho phép GET
            AllowedOrigins: ["*"] // Cho phép tất cả các origin
          }
        ]
      }
    },
    err => {
      if (err) {
        console.log("Error configuring CORS: ", err, err.stack);
      } else {
        console.log("Bucket CORS configuration succeeded!");
      }
    }
  );

// Gọi hàm để cấu hình CORS cho bucket đã tồn tại
editBucketCORS();
