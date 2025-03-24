"use strict";

const express = require("express");
const multer = require("multer");
const router = express.Router();
const AccountController = require("../../controllers/account.controller");
const { asyncHandler, authenticationV2 } = require("../../auth/authUtils");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const createAvatarUpload = upload.fields([{ name: "avatar", maxCount: 1 }]);

router.post(
  "/account/create",
  createAvatarUpload,
  asyncHandler(AccountController.createAccount)
);
router.put(
  "/account/update",
  createAvatarUpload,
  asyncHandler(AccountController.updateAccount)
); // example: /account/update?userId=123
router.delete("/account/delete", asyncHandler(AccountController.deleteAccount)); // example: /account/delete?userId=123
router.delete(
  "/account/delete-favourite",
  asyncHandler(AccountController.deleteFavouriteTour)
); // example: /account/delete-favourite?userId=123&tourId=456
router.get("/account/get", asyncHandler(AccountController.getAccountById)); // example: /account/get?userId=123
router.get(
  "/account/favourite",
  asyncHandler(AccountController.getFavouriteTourByUserId)
); // example: /account/favourite?userId=123
router.get(
  "/account/get-role",
  asyncHandler(AccountController.getAccountByQuery)
); // example: /account/get-role?role=USER or /account/get-role?role=WRITER

module.exports = router;
