const BookingRepo = require("./repositories/booking.repo");
const { BadRequestError } = require("../core/error.response");

// src/services/statistical.service.js

("use strict");

class StatisticalService {
  // Helper to validate and parse dates
  static _getDateRange(year, month = null, day = null) {
    // Validate year
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      throw new BadRequestError("Invalid year");
    }

    // If month provided, validate it
    if (month) {
      console.log("month", month);
      const monthNum = parseInt(month);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        throw new BadRequestError("Invalid month");
      }

      if (day) {
        const dayNum = parseInt(day);
        if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
          throw new BadRequestError("Invalid day");
        }
        return {
          startDate: new Date(Date.UTC(yearNum, monthNum - 1, dayNum, 0, 0, 0)),
          endDate: new Date(
            Date.UTC(yearNum, monthNum - 1, dayNum, 23, 59, 59)
          ),
        };
      }

      // Get last day of month
      const lastDay = new Date(yearNum, monthNum, 0).getDate();

      return {
        startDate: new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0)),
        endDate: new Date(Date.UTC(yearNum, monthNum - 1, lastDay, 23, 59, 59)),
      };
    }

    // Full year range
    return {
      startDate: new Date(Date.UTC(yearNum, 0, 1, 0, 0, 0)),
      endDate: new Date(Date.UTC(yearNum, 11, 31, 23, 59, 59)),
    };
  }

  static _getDateRangeFromDateToDate(fromday, toDay) {
    // Validate year
    // day format: yyyy-mm-dd
    const fromDate = new Date(fromday);
    const toDate = new Date(toDay);
    // console.log(fromDate, toDate);
    console.log(
      fromDate.getFullYear(),
      fromDate.getMonth(),
      fromDate.getDate()
    );
    return {
      startDate: new Date(
        Date.UTC(
          fromDate.getFullYear(),
          fromDate.getMonth(),
          fromDate.getDate(),
          0,
          0,
          0
        )
      ),
      endDate: new Date(
        Date.UTC(
          toDate.getFullYear(),
          toDate.getMonth() + 1,
          toDate.getDate(),
          23,
          59,
          59
        )
      ),
    };
  }

  // Calculate revenue by tour with date range
  static async calculateRevenueByTour(fromDate, toDate) {
    const dateQuery = {};
    if (fromDate && toDate) {
      const { startDate, endDate } = this._getDateRangeFromDateToDate(
        fromDate,
        toDate
      );
      console.log(startDate, endDate);
      dateQuery.updatedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const pipeline = [
      {
        $match: {
          status: "success",
          ...dateQuery,
        },
      },
      // Rest of pipeline remains same
    ];

    return await BookingRepo.aggregate(pipeline);
  }

  // Calculate revenue by tour of today
  static async calculateRevenueByTourOfToday() {
    const now = new Date();
    const startToday = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    ); // Start of today
    console.log(startToday);
    const endToday = new Date( // End of today
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    );

    console.log(endToday);
    const pipeline = [
      {
        $match: {
          status: "success",
          updatedAt: {
            $gte: startToday,
            $lt: endToday,
          },
        },
      },
      // Rest of pipeline remains same
    ];

    return await BookingRepo.aggregate(pipeline);
  }

  // Calculate revenue by quarter
  static async calculateRevenueByQuarter(quarter) {
    // const { startDate, endDate } = this._getDateRange(year);
    const now = new Date();
    const currentYear = now.getFullYear();

    if (quarter) {
      if (quarter < 1 || quarter > 4) {
        throw new BadRequestError("Invalid quarter");
      }

      if (quarter === 1) {
        var startDate = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0));
        var endDate = new Date(Date.UTC(currentYear, 2, 31, 23, 59, 59));
      } else if (quarter === 2) {
        var startDate = new Date(Date.UTC(currentYear, 3, 1, 0, 0, 0));
        var endDate = new Date(Date.UTC(currentYear, 5, 30, 23, 59, 59));
      } else if (quarter === 3) {
        var startDate = new Date(Date.UTC(currentYear, 6, 1, 0, 0, 0));
        var endDate = new Date(Date.UTC(currentYear, 8, 30, 23, 59, 59));
      } else {
        var startDate = new Date(Date.UTC(currentYear, 9, 1, 0, 0, 0));
        var endDate = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59));
      }
    } else {
      var startDate = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0));
      var endDate = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59));
    }

    const pipeline = [
      {
        $match: {
          status: "success",
          updatedAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$updatedAt" },
            quarter: {
              $ceil: {
                $divide: [{ $month: "$updatedAt" }, 3],
              },
            },
          },
          totalRevenue: { $sum: "$total_price" },
          totalBookings: { $sum: 1 },
          averageBookingValue: { $avg: "$total_price" },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.quarter": 1,
        },
      },
    ];

    return await BookingRepo.aggregate(pipeline);
  }

  // Calculate revenue by month
  static async calculateRevenueOfEachMonth() {
    const now = new Date();
    const currentYear = now.getFullYear();

    const pipeline = [
      {
        $match: {
          status: "success",
          updatedAt: {
            $gte: new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0)),
            $lte: new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59)),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$updatedAt" },
            month: { $month: "$updatedAt" },
          },
          totalRevenue: { $sum: "$total_price" },
          totalBookings: { $sum: 1 },
          averageBookingValue: { $avg: "$total_price" },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ];

    return await BookingRepo.aggregate(pipeline);
  }

  // Calculate revenue by day
  static async calculateRevenueByDay(day) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const { startDate, endDate } = this._getDateRange(
      currentYear,
      currentMonth,
      day
    );

    const pipeline = [
      {
        $match: {
          status: "success",
          updatedAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$updatedAt" },
            month: { $month: "$updatedAt" },
            day: { $dayOfMonth: "$updatedAt" },
          },
          totalRevenue: { $sum: "$total_price" },
          totalBookings: { $sum: 1 },
          averageBookingValue: { $avg: "$total_price" },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        },
      },
    ];

    return await BookingRepo.aggregate(pipeline);
  }

  // Get most booked tours
  static async getMostBookedTours(limit, fromDate, toDate) {
    const dateQuery = {};
    if (fromDate && toDate) {
      dateQuery.updatedAt = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    const pipeline = [
      {
        $match: {
          status: "success",
          ...dateQuery,
        },
      },
      {
        $group: {
          _id: "$tour",
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: "$total_price" },
          averageBookingValue: { $avg: "$total_price" },
        },
      },
      {
        $sort: {
          totalBookings: -1,
        },
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: "tours",
          localField: "_id",
          foreignField: "_id",
          as: "tour",
        },
      },
      {
        $unwind: "$tour",
      },
      {
        $project: {
          _id: 0,
          tour: {
            _id: 1,
            name: 1,
            price: 1,
            thumbnail_url: 1,
            destination: 1,
          },
          totalBookings: 1,
          totalRevenue: 1,
          averageBookingValue: 1,
        },
      },
    ];

    return await BookingRepo.aggregate(pipeline);
  }

  static async getDashboardStats() {
    const pipeline = [
      {
        $match: {
          status: "success", // Only count successful bookings
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total_price" },
          totalBookings: { $sum: 1 },
          totalBookedPeople: { $sum: "$number_of_people" },
        },
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1,
          totalBookings: 1,
          totalBookedPeople: 1,
        },
      },
    ];

    const result = await BookingRepo.aggregate(pipeline);
    return (
      result[0] || {
        totalRevenue: 0,
        totalBookings: 0,
        totalBookedPeople: 0,
      }
    );
  }

  // Get top tours by booking count for specific month/year
  static async getTopBookedToursByMonth(month, year, limit = 10) {
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    const pipeline = [
      {
        $match: {
          status: "success",
          updatedAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: "$tour",
          bookingCount: { $sum: 1 },
          totalPeople: { $sum: "$number_of_people" },
          totalRevenue: { $sum: "$total_price" },
        },
      },
      {
        $lookup: {
          from: "Tours",
          localField: "_id",
          foreignField: "_id",
          as: "tourDetails",
        },
      },
      {
        $unwind: "$tourDetails",
      },
      {
        $project: {
          _id: 0,
          tour: {
            _id: "$tourDetails._id",
            name: "$tourDetails.name",
            destination: "$tourDetails.destination",
            thumbnail_url: "$tourDetails.thumbnail_url",
          },
          bookingCount: 1,
          totalPeople: 1,
          totalRevenue: 1,
        },
      },
      {
        $sort: { bookingCount: -1 },
      },
      {
        $limit: limit,
      },
    ];

    return await BookingRepo.aggregate(pipeline);
  }

  // Get top tours by revenue for specific month/year
  static async getTopRevenueToursByMonth(month, year, limit = 10) {
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    console.log(startDate, endDate);

    const pipeline = [
      {
        $match: {
          status: "success",
          updatedAt: {
            // Typo here: should be 'updatedAt'
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: "$tour",
          totalRevenue: { $sum: "$total_price" },
          bookingCount: { $sum: 1 },
          totalPeople: { $sum: "$number_of_people" },
        },
      },
      {
        $lookup: {
          from: "Tours",
          localField: "_id",
          foreignField: "_id",
          as: "tourDetails",
        },
      },
      {
        $unwind: "$tourDetails",
      },
      {
        $project: {
          _id: 0,
          tour: {
            _id: "$tourDetails._id",
            name: "$tourDetails.name",
            destination: "$tourDetails.destination",
            thumbnail_url: "$tourDetails.thumbnail_url",
          },
          totalRevenue: 1,
          bookingCount: 1,
          totalPeople: 1,
          averageRevenue: { $divide: ["$totalRevenue", "$bookingCount"] },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
      {
        $limit: limit,
      },
    ];

    return await BookingRepo.aggregate(pipeline);
  }
}

module.exports = StatisticalService;
