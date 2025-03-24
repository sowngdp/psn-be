"use strict";

const HEADER = {
  API_KEY: "x-api-key",
  AUTHORIZATION: "authorization",
};

const apiKeyService = require("../services/apiKey.service");

const checkApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers[HEADER.API_KEY]?.toString();
    const authorization = req.headers[HEADER.AUTHORIZATION];

    if (!apiKey) {  // Kiểm tra cả apiKey và authorization
      return res.status(403).json({  // Đặt mã trạng thái HTTP trước khi trả về JSON
        status: 403,
        message: "Forbidden",
        statusText: "API Key and Authorization are required",
      });
    }

    // Check if the API key is valid
    const objectKey = await apiKeyService.findByID(apiKey);
    console.log(objectKey);
    if (!objectKey) {
      return res.status(403).json({
        status: 403,
        message: "Forbidden",
        statusText: "API Key is invalid",
      });
    }

    // Nếu cần kiểm tra thêm tính hợp lệ của authorization, bạn có thể thêm ở đây
    // Ví dụ: if (!isValidAuthorization(authorization)) { ... }

    req.objectKey = objectKey;
    return next();

  } catch (error) {
    console.error("Error in checkAuth:", error);  // In ra lỗi chi tiết để dễ theo dõi
    return res.status(403).json({
      status: 403,
      message: "Forbidden",
    });
  }
};


const checkPermission = (permission) => {
  // Check if the user has permission to access the resource
  // Example: if (!hasPermission(req.user, req.params.id)) { ... }
  return (req, res, next) => {
    if (!req.objectKey.permissions) {
      return res.status(403).json({
        status: 403,
        message: "Forbidden",
        statusText: "No permission",
      });
    }

    console.log("Permission:", permission);

    const validPermission = req.objectKey.permissions.includes(permission);
    if (!validPermission) {
      return res.status(403).json({
        status: 403,
        message: "Forbidden",
        statusText: "No permission",
      });
    }

    return next();

  };
}

module.exports = {
  checkApiKey,
  checkPermission,
};