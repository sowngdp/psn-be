'use strict';

const express = require('express');
const router = express.Router();
const { authentication } = require('../middlewares/authentication');
const WeatherController = require('../controllers/weather.controller');

/**
 * @swagger
 * tags:
 *   name: Weather
 *   description: API liên quan đến thời tiết và đề xuất trang phục theo thời tiết
 */

/**
 * @swagger
 * /weather/current:
 *   get:
 *     summary: Lấy thông tin thời tiết hiện tại
 *     tags: [Weather]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Vĩ độ vị trí
 *       - in: query
 *         name: lon
 *         schema:
 *           type: number
 *         description: Kinh độ vị trí
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Tên thành phố (thay thế cho lat/lon)
 *     responses:
 *       200:
 *         description: Thông tin thời tiết
 *       400:
 *         description: Thiếu thông tin vị trí
 */
router.get('/current', WeatherController.getCurrentWeather);

/**
 * @swagger
 * /weather/forecast:
 *   get:
 *     summary: Lấy dự báo thời tiết
 *     tags: [Weather]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Vĩ độ vị trí
 *       - in: query
 *         name: lon
 *         schema:
 *           type: number
 *         description: Kinh độ vị trí
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Tên thành phố (thay thế cho lat/lon)
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 3
 *         description: Số ngày dự báo
 *     responses:
 *       200:
 *         description: Dự báo thời tiết
 *       400:
 *         description: Thiếu thông tin vị trí
 */
router.get('/forecast', WeatherController.getWeatherForecast);

/**
 * @swagger
 * /weather/outfits:
 *   get:
 *     summary: Lấy đề xuất trang phục theo thời tiết
 *     tags: [Weather]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Vĩ độ vị trí
 *       - in: query
 *         name: lon
 *         schema:
 *           type: number
 *         description: Kinh độ vị trí
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Tên thành phố (thay thế cho lat/lon)
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Ngày áp dụng (mặc định là hiện tại)
 *     responses:
 *       200:
 *         description: Đề xuất trang phục
 *       400:
 *         description: Thiếu thông tin vị trí
 *       401:
 *         description: Không được ủy quyền
 */
router.get('/outfits', authentication, WeatherController.getOutfitsForWeather);

module.exports = router; 