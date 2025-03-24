"use strict";

const express = require("express");
const { apiKey, checkPermission } = require("../auth/authUtils");
const router = express.Router();

// Kiểm tra API key
router.use(apiKey);
// Kiểm tra quyền truy cập
router.use(checkPermission("0000"));

// Thiết lập API versioning
router.use("/v1/api/auth", require("./access"));
router.use("/v1/api/account", require("./account"));
router.use("/v1/api/style-rules", require("./style-rules"));
router.use("/v1/api/outfits", require("./outfits"));
router.use("/v1/api/items", require("./items"));
router.use("/v1/api/schedules", require("./schedules"));
router.use("/v1/api/user-style-profiles", require("./user-style-profiles"));
router.use("/v1/api/recommendations", require("./recommendations"));
router.use("/v1/api/categories", require("./categories"));
router.use("/v1/api/notifications", require("./notifications"));
router.use("/v1/api/activities", require("./activities"));
router.use("/v1/api/feedbacks", require("./feedbacks"));

// Thiết lập API version tương lai để dễ dàng nâng cấp
// router.use("/v2/api/auth", require("./v2/access"));

module.exports = router;
