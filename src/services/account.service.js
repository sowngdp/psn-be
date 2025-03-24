"use strict";
const accountModel = require("../models/account.model");

class AccountService {
  static async getFavoriteTour(userId) {
    return await accountModel.findById(userId).populate("favoriteTours").lean();
  }
  static async addFavoriteTour(userId, tourId) {
    const account = await accountModel.findById(userId);
    // check if tourId is already in favoriteTours
    if (account.favoriteTours.includes(tourId)) {
      throw new Error("Tour is already in favorite list");
    }
    account.favourite_lists.push(tourId);
    await account.save();
    return account;
  }

  static async deleteFavoriteTour(userId, tourId) {
    const account = await accountModel.findById(userId);
    account.favoriteTours = account.favoriteTours.filter(
      (item) => item.toString() !== tourId
    );
    await account.save();
    return account;
  }

  static async findByEmail({
    email,
    select = {
      email: 1,
      password: 2,
      name: 1,
      status: 1,
      roles: 1,
    },
  }) {
    return await accountModel.findOne({ email }).select(select).lean();
  }

  static async createAccount(data) {
    return await accountModel.create(data);
  }

  static async updateAccount(id, data) {
    const account = await accountModel.findByIdAndUpdate(id, data, {
      new: true,
    });
    return account;
  }

  static async deleteAccount(userId) {
    return await accountModel.findByIdAndDelete(userId);
  }

  static async getAccountById(userId) {
    return await accountModel.findById(userId);
  }

  static async getAllAccount() {
    const accounts = await accountModel.find();
    return accounts;
  }

  static async getAccountByQuery(role) {
    return await accountModel.find({ roles: role });
  }
}

const findByEmail = async ({
  email,
  select = {
    email: 1,
    password: 2,
    name: 1,
    status: 1,
    roles: 1,
  },
}) => {
  return await accountModel.findOne({ email }).select(select).lean();
};

module.exports = AccountService;
// module.exports = { findByEmail };
