'use strict';

const WeatherService = require('./weather.service');
const { BadRequestError } = require('../core/error.response');
const userModel = require('../db/models/user.model');
const cache = require('../utils/cache');

// Thời gian cache cho dữ liệu context (15 phút)
const CONTEXT_CACHE_TTL = 15 * 60 * 1000;

class ContextService {
  /**
   * Lấy ngữ cảnh hiện tại của người dùng
   * @param {string} userId - ID của người dùng
   * @param {Object} locationData - Vị trí người dùng (lat, lon, city)
   * @param {string} date - Ngày dự kiến (mặc định là ngày hiện tại)
   * @returns {Promise<Object>} Ngữ cảnh người dùng
   */
  static async getUserCurrentContext(userId, locationData, date = new Date().toISOString()) {
    try {
      // Tạo cache key
      const cacheKey = `context:${userId}:${JSON.stringify(locationData)}:${date}`;
      
      // Kiểm tra cache
      return await cache.getOrSet(
        cacheKey,
        async () => {
          // 1. Lấy thông tin thời tiết
          let weatherData = {};
          if (locationData && (locationData.city || (locationData.lat && locationData.lon))) {
            try {
              weatherData = await WeatherService.getCurrentWeather(locationData);
              weatherData = WeatherService.mapWeatherToOutfitConditions(weatherData);
            } catch (error) {
              console.error('Error fetching weather data:', error);
              // Nếu không lấy được thời tiết, vẫn tiếp tục với dữ liệu khác
            }
          }
          
          // 2. Xác định dịp/sự kiện từ calendar (nếu có thể)
          const occasionData = await this.detectOccasionFromCalendar(userId, date);
          
          // 3. Lấy thông tin user preferences
          const user = await userModel.findById(userId).lean();
          const userPreferences = user?.preferences || {};
          
          // 4. Xác định mùa
          const season = weatherData.season || this._getCurrentSeason();
          
          // 5. Tổng hợp ngữ cảnh
          return {
            weather: weatherData,
            occasion: occasionData.occasion,
            season,
            date: new Date(date),
            location: locationData,
            userPreferences
          };
        },
        CONTEXT_CACHE_TTL
      );
    } catch (error) {
      throw new BadRequestError(`Không thể lấy ngữ cảnh người dùng: ${error.message}`);
    }
  }
  
  /**
   * Xác định dịp/sự kiện từ lịch
   * @param {string} userId - ID của người dùng
   * @param {string} date - Ngày cần kiểm tra
   * @returns {Promise<Object>} Thông tin về dịp/sự kiện
   */
  static async detectOccasionFromCalendar(userId, date) {
    // Placeholder, trong triển khai thực tế, đây sẽ kết nối với Google Calendar hoặc Apple Calendar
    
    // Mô phỏng định nghĩa các dịp/sự kiện
    const occasionKeywords = {
      'business': ['meeting', 'conference', 'interview', 'work', 'office'],
      'casual': ['hangout', 'coffee', 'lunch', 'relax', 'shopping'],
      'formal': ['wedding', 'ceremony', 'gala', 'dinner', 'party'],
      'sport': ['gym', 'workout', 'running', 'exercise', 'training'],
      'vacation': ['travel', 'trip', 'vacation', 'holiday', 'tour'],
      'date': ['date', 'romantic', 'dinner date']
    };
    
    // Trong triển khai thực tế, bạn sẽ:
    // 1. Kết nối với API Calendar
    // 2. Lấy sự kiện cho ngày đã cho
    // 3. Phân tích mô tả sự kiện để xác định dịp/sự kiện
    
    // Dummy implementation
    return {
      occasion: 'casual', // Default occasion
      eventTitle: '',
      eventDescription: '',
      confidence: 0.7
    };
  }
  
  /**
   * Lấy thông tin vị trí từ dữ liệu đã cho
   * @param {Object} locationData - Dữ liệu vị trí (lat, lon, city)
   * @returns {Promise<Object>} Thông tin địa lý
   */
  static async getLocationData(locationData) {
    try {
      const { lat, lon, city } = locationData;
      
      // Nếu có tọa độ, ưu tiên dùng tọa độ
      if (lat && lon) {
        // Placeholder: Trong triển khai thực tế, có thể reverse geocode để lấy thông tin địa điểm
        return {
          coordinates: { lat, lon },
          address: city || 'Unknown',
          formatted: city || `${lat}, ${lon}`
        };
      } 
      // Nếu chỉ có thành phố
      else if (city) {
        // Placeholder: Trong triển khai thực tế, có thể geocode để lấy tọa độ
        return {
          coordinates: { lat: null, lon: null },
          address: city,
          formatted: city
        };
      }
      
      throw new BadRequestError('Không đủ thông tin vị trí');
    } catch (error) {
      throw new BadRequestError(`Không thể xử lý thông tin vị trí: ${error.message}`);
    }
  }
  
  /**
   * Xác định mùa hiện tại
   * @private
   */
  static _getCurrentSeason() {
    const now = new Date();
    const month = now.getMonth();
    
    // Giả định ở Bắc bán cầu
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }
}

module.exports = ContextService; 