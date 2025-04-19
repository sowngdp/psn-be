'use strict';

const WeatherService = require('../../services/weather.service');
const RecommendationService = require('../../services/recommendation.service');
const { OK } = require('../../core/success.response');
const { BadRequestError } = require('../../core/error.response');

class WeatherController {
  /**
   * Lấy thông tin thời tiết hiện tại
   */
  static async getCurrentWeather(req, res, next) {
    try {
      const { lat, lon, city } = req.query;
      
      // Đảm bảo có ít nhất một cách để xác định vị trí
      if ((!lat || !lon) && !city) {
        throw new BadRequestError('Vui lòng cung cấp tọa độ (lat, lon) hoặc tên thành phố');
      }
      
      const locationData = { lat, lon, city };
      const weatherData = await WeatherService.getCurrentWeather(locationData);
      
      return new OK({
        message: 'Lấy thông tin thời tiết hiện tại thành công',
        metadata: weatherData
      }).send(res);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy dự báo thời tiết
   */
  static async getWeatherForecast(req, res, next) {
    try {
      const { lat, lon, city, days = 3 } = req.query;
      
      // Đảm bảo có ít nhất một cách để xác định vị trí
      if ((!lat || !lon) && !city) {
        throw new BadRequestError('Vui lòng cung cấp tọa độ (lat, lon) hoặc tên thành phố');
      }
      
      const locationData = { lat, lon, city };
      const forecastData = await WeatherService.getWeatherForecast(locationData, parseInt(days));
      
      return new OK({
        message: 'Lấy dự báo thời tiết thành công',
        metadata: forecastData
      }).send(res);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lấy đề xuất outfit dựa trên thời tiết
   */
  static async getOutfitsForWeather(req, res, next) {
    try {
      const userId = req.user.userId;
      const { lat, lon, city, date } = req.query;
      
      // Đảm bảo có ít nhất một cách để xác định vị trí
      if ((!lat || !lon) && !city) {
        throw new BadRequestError('Vui lòng cung cấp tọa độ (lat, lon) hoặc tên thành phố');
      }
      
      // Lấy thông tin thời tiết
      const locationData = { lat, lon, city };
      const weatherData = await WeatherService.getCurrentWeather(locationData);
      
      // Chuyển đổi thành điều kiện outfit
      const outfitConditions = WeatherService.mapWeatherToOutfitConditions(weatherData);
      
      // Tạo đề xuất từ thông tin thời tiết
      const recommendation = await RecommendationService.createRecommendation({
        userId,
        type: 'weather',
        context: {
          weather: {
            temperature: outfitConditions.temperature,
            condition: outfitConditions.condition,
            description: outfitConditions.description
          },
          location: locationData,
          date: date || new Date().toISOString()
        }
      });
      
      return new OK({
        message: 'Lấy đề xuất trang phục theo thời tiết thành công',
        metadata: {
          weather: outfitConditions,
          recommendation
        }
      }).send(res);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = WeatherController; 