// src/services/repositories/booking.repo.js
"use strict";

const bookingModel = require("../../models/booking.model");

class BookingRepo {
  static async countDocuments(query) {
    return await bookingModel.countDocuments(query);
  }
  // Aggregate operations
  static async aggregate(pipeline) {
    return await bookingModel.aggregate(pipeline);
  }
  // Basic CRUD operations
  static async getAllBooking() {
    return await bookingModel
      .find()
      .populate("tour", "name price thumbnail_url destination")
      .populate("user", "name email")
      .lean();
  }

  static async getBookingById(id) {
    const query = {};
    if (id) query._id = id;
    return await bookingModel
      .findOne(query)
      .populate("tour", "name price thumbnail_url destination")
      .populate("user", "name email")
      .lean();
  }

  static async getBookings(query) {
    return await bookingModel
      .find(query)
      .populate("tour", "name price thumbnail_url destination")
      .populate("user", "name email")
      .lean();
  }

  static async getBookingToday(page, limit) {
    // const today = new Date();
    // today.setHours(0, 0, 0, 0);
    // today.setDate(today.getDate() + 1);
    // const tomorrow = new Date(today);
    // tomorrow.setDate(tomorrow.getDate() + 1);
    // const skip = (page - 1) * limit;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    console.log(today, tomorrow);

    return await bookingModel
      .find({
        updatedAt: {
          $gte: today,
          $lt: tomorrow,
        },
      })
      .populate("tour", "name price thumbnail_url destination")
      .populate("user", "name email")
      .lean();
  }

  static async createBooking(data) {
    const booking = await bookingModel.create(data);
    return await booking.populate([
      { path: "tour", select: "name price thumbnail_url destination" },
      { path: "user", select: "name email" },
    ]);
  }

  static async updateBooking(id, data) {
    const booking = await bookingModel
      .findByIdAndUpdate(id, data, { new: true })
      .populate([
        { path: "tour", select: "name price thumbnail_url destination" },
        { path: "user", select: "name email" },
      ]);
    return booking;
  }

  static async deleteBooking(id) {
    return await bookingModel.findByIdAndDelete(id);
  }

  // Specialized queries
  static async getBookingByUserId(userId) {
    return await bookingModel
      .find({ user: userId })
      .populate("tour", "name price thumbnail_url destination")
      .lean();
  }

  static async getBookingByTourId(tourId) {
    return await bookingModel
      .find({ tour: tourId })
      .populate("user", "name price thumbnail_url destination")
      .lean();
  }

  static async checkExistingBookings(tourId, userId) {
    return await bookingModel
      .findOne({
        tour: tourId,
        user: userId,
        status: { $in: ["pending", "success"] },
      })
      .lean();
  }

  static async getBookingsByDateRange(tourId, startDate, endDate) {
    return await bookingModel
      .find({
        tour: tourId,
        created_at: {
          $gte: startDate,
          $lte: endDate,
        },
        status: { $ne: "cancelled" },
      })
      .lean();
  }

  static async countActiveBookings(tourId) {
    return await bookingModel.countDocuments({
      tour: tourId,
      status: { $in: ["pending", "success"] },
    });
  }
}

module.exports = BookingRepo;
