"use strict";

const AccountService = require("../services/account.service");
const ImageService = require("../helpers/upload.image");

const { Success } = require("../core/success.response");
const FirebaseStorage = require("../helpers/firebase.storage");

class AccountController {
  static getFavouriteTourByUserId = async (req, res, next) => {
    const { userId } = req.query;
    const account = await AccountService.getFavoriteTour(userId);
    return new Success({
      message: "Get favorite tour success!",
      metadata: account,
    }).send(res);
  };

  static deleteFavouriteTour = async (req, res, next) => {
    const { userId, tourId } = req.query;
    const account = await AccountService.deleteFavoriteTour(userId, tourId);
    return new Success({
      message: "Delete favorite tour success!",
      metadata: account,
    }).send(res);
  };

  static createAccount = async (req, res, next) => {
    const { user_name, email, password } = req.body;
    const account = await AccountService.createAccount({
      user_name,
      email,
      password,
    });
    return new Success({
      message: "Create account success!",
      metadata: account,
    }).send(res);
  };

  static async updateAccount(req, res, next) {
    try {
      const { userId } = req.query;
      const { name, phone_number, address, date_of_birth } = req.body;
      const files = req.files;
      let avatarUrl = null;
      const accountData = await AccountService.getAccountById(userId);
      avatarUrl = accountData.avatar;

      if (files && files["avatar"]) {
        const avatar = files["avatar"][0];
        // Sử dụng instance của FirebaseStorage

        const firebaseStorage = FirebaseStorage.getInstance();
        avatarUrl = await firebaseStorage.updateImage(
          accountData.avatar,
          avatar
        );
      }

      const accountUpdateData = {
        avatar: avatarUrl,
        name,
        phone_number,
        address,
        date_of_birth,
      };
      const account = await AccountService.updateAccount(
        userId,
        accountUpdateData
      );
      return new Success({
        message: "Update account success!",
        metadata: account,
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  static deleteAccount = async (req, res, next) => {
    const { userId } = req.query;
    const account = await AccountService.deleteAccount(userId);
    return new Success({
      message: "Delete account success!",
      metadata: account,
    }).send(res);
  };

  static getAccountById = async (req, res, next) => {
    const { userId } = req.query;
    const account = await AccountService.getAccountById(userId);
    return new Success({
      message: "Get account success!",
      metadata: account,
    }).send(res);
  };

  static getAllAccount = async (req, res, next) => {
    const account = await AccountService.getAllAccount();
    return new Success({
      message: "Get all account success!",
      metadata: account,
    }).send(res);
  };

  static getAccountByQuery = async (req, res, next) => {
    const { role } = req.query;
    const account = await AccountService.getAccountByQuery(role);
    return new Success({
      message: "Get account success!",
      metadata: account,
    }).send(res);
  };
}

module.exports = AccountController;
