"use strict";

const tourModel = require("../../models/tour.model");
const categoryModel = require("../../models/category.model");

class TourRepo {
  static async getAllTour() {
    const tours = await tourModel.find().lean();
    return tours;
  }

  static async getTourById(id) {
    const tour = await tourModel.findById(id).lean();
    return tour;
  }

  static async getTours(page, limit, categoryId, price, destination) {
    if (!page) {
      page = 1;
    }
    if (!limit) {
      limit = 10;
    }
    const skip = (page - 1) * limit;
    const query = {};

    if (categoryId) {
      query.categories = categoryId;
    }
    if (price) {
      query.price = { $lte: price };
    }

    if (destination) {
      query.destination = { $regex: destination, $options: "i" };
    }

    const tours = await tourModel
      .find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    return tours;
  }

  static async createTour(data) {
    const tour = await tourModel.create(data);
    return tour;
  }

  static async updateTour(id, data) {
    const tour = await tourModel.findByIdAndUpdate(id, data, { new: true });
    return tour;
  }

  static async deleteTour(id) {
    const tour = await tourModel.findByIdAndDelete(id);
    return tour;
  }
}

module.exports = TourRepo;
