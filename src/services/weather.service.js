'use strict';

const axios = require('axios');
const { BadRequestError } = require('../core/error.response');
const cache = require('../utils/cache');

// Thời gian cache cho dữ liệu thời tiết (1 giờ)
const WEATHER_CACHE_TTL = 60 * 60 * 1000;

class WeatherService {
  /**
   * Lấy thông tin thời tiết hiện tại cho một vị trí
   * @param {Object} locationData - Dữ liệu vị trí (lat, lon hoặc city)
   * @returns {Promise<Object>} Thông tin thời tiết
   */
  static async getCurrentWeather(locationData) {
    try {
      const { lat, lon, city } = locationData;
      
      // Tạo cache key
      const cacheKey = `weather:current:${lat},${lon}` || `weather:current:${city}`;
      
      // Kiểm tra và trả về dữ liệu từ cache nếu có
      return await cache.getOrSet(
        cacheKey,
        async () => {
          // Nếu có tọa độ, sử dụng tọa độ
          if (lat && lon) {
            return await this._fetchWeatherByCoords(lat, lon);
          } 
          // Nếu không, sử dụng tên thành phố
          else if (city) {
            return await this._fetchWeatherByCity(city);
          } else {
            throw new BadRequestError('Yêu cầu cung cấp vị trí (tọa độ hoặc tên thành phố)');
          }
        },
        WEATHER_CACHE_TTL
      );
    } catch (error) {
      throw new BadRequestError(`Không thể lấy thông tin thời tiết: ${error.message}`);
    }
  }
  
  /**
   * Lấy dự báo thời tiết cho một vị trí
   * @param {Object} locationData - Dữ liệu vị trí (lat, lon hoặc city)
   * @param {number} days - Số ngày dự báo (mặc định: 3)
   * @returns {Promise<Object>} Thông tin dự báo thời tiết
   */
  static async getWeatherForecast(locationData, days = 3) {
    try {
      const { lat, lon, city } = locationData;
      
      // Tạo cache key
      const cacheKey = `weather:forecast:${days}:${lat},${lon}` || `weather:forecast:${days}:${city}`;
      
      // Kiểm tra và trả về dữ liệu từ cache nếu có
      return await cache.getOrSet(
        cacheKey,
        async () => {
          // Nếu có tọa độ, sử dụng tọa độ
          if (lat && lon) {
            return await this._fetchForecastByCoords(lat, lon, days);
          } 
          // Nếu không, sử dụng tên thành phố
          else if (city) {
            return await this._fetchForecastByCity(city, days);
          } else {
            throw new BadRequestError('Yêu cầu cung cấp vị trí (tọa độ hoặc tên thành phố)');
          }
        },
        WEATHER_CACHE_TTL
      );
    } catch (error) {
      throw new BadRequestError(`Không thể lấy dự báo thời tiết: ${error.message}`);
    }
  }
  
  /**
   * Chuyển đổi thông tin thời tiết thành điều kiện outfit
   * @param {Object} weatherData - Dữ liệu thời tiết
   * @returns {Object} Điều kiện outfit
   */
  static mapWeatherToOutfitConditions(weatherData) {
    // Lấy thông tin nhiệt độ và điều kiện thời tiết
    const temperature = weatherData.main?.temp;
    const condition = weatherData.weather?.[0]?.main;
    const description = weatherData.weather?.[0]?.description;
    const windSpeed = weatherData.wind?.speed;
    const humidity = weatherData.main?.humidity;
    
    // Xác định mùa dựa trên nhiệt độ
    let season = 'all';
    if (temperature < 10) season = 'winter';
    else if (temperature < 20) season = 'fall';
    else if (temperature < 30) season = 'spring';
    else season = 'summer';
    
    // Xác định các tag liên quan đến điều kiện thời tiết
    const weatherTags = [];
    if (condition) {
      if (condition.toLowerCase().includes('rain') || description?.toLowerCase().includes('rain')) {
        weatherTags.push('waterproof', 'rain-friendly');
      }
      if (condition.toLowerCase().includes('snow') || description?.toLowerCase().includes('snow')) {
        weatherTags.push('winter', 'warm', 'snow');
      }
      if (condition.toLowerCase().includes('cloud') || description?.toLowerCase().includes('cloud')) {
        weatherTags.push('layered');
      }
      if (windSpeed > 5) {
        weatherTags.push('windproof', 'layered');
      }
      if (temperature > 30 || condition.toLowerCase().includes('clear') && temperature > 25) {
        weatherTags.push('summer', 'cool', 'breathable');
      }
      if (temperature < 10) {
        weatherTags.push('winter', 'warm', 'insulated');
      }
      if (humidity > 80) {
        weatherTags.push('breathable', 'light');
      }
    }
    
    return {
      temperature,
      condition,
      description,
      season,
      weatherTags,
      windSpeed,
      humidity
    };
  }
  
  /**
   * Lấy thông tin thời tiết qua tọa độ
   * @private
   */
  static async _fetchWeatherByCoords(lat, lon) {
    try {
      const apiKey = process.env.OPENWEATHER_API_KEY || '12345'; // Thay thế bằng API key thực tế
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching weather by coords:', error);
      throw new Error('Không thể lấy thông tin thời tiết qua tọa độ');
    }
  }
  
  /**
   * Lấy thông tin thời tiết qua tên thành phố
   * @private
   */
  static async _fetchWeatherByCity(city) {
    try {
      const apiKey = process.env.OPENWEATHER_API_KEY || '12345'; // Thay thế bằng API key thực tế
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching weather by city:', error);
      throw new Error('Không thể lấy thông tin thời tiết qua tên thành phố');
    }
  }
  
  /**
   * Lấy dự báo thời tiết qua tọa độ
   * @private
   */
  static async _fetchForecastByCoords(lat, lon, days) {
    try {
      const apiKey = process.env.OPENWEATHER_API_KEY || '12345'; // Thay thế bằng API key thực tế
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&cnt=${days * 8}&appid=${apiKey}`;
      
      const response = await axios.get(url);
      return this._processForecastData(response.data, days);
    } catch (error) {
      console.error('Error fetching forecast by coords:', error);
      throw new Error('Không thể lấy dự báo thời tiết qua tọa độ');
    }
  }
  
  /**
   * Lấy dự báo thời tiết qua tên thành phố
   * @private
   */
  static async _fetchForecastByCity(city, days) {
    try {
      const apiKey = process.env.OPENWEATHER_API_KEY || '12345'; // Thay thế bằng API key thực tế
      const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&cnt=${days * 8}&appid=${apiKey}`;
      
      const response = await axios.get(url);
      return this._processForecastData(response.data, days);
    } catch (error) {
      console.error('Error fetching forecast by city:', error);
      throw new Error('Không thể lấy dự báo thời tiết qua tên thành phố');
    }
  }
  
  /**
   * Xử lý dữ liệu dự báo thành các ngày riêng biệt
   * @private
   */
  static _processForecastData(forecastData, days) {
    const dailyForecasts = [];
    const list = forecastData.list || [];
    
    // Phân nhóm dự báo theo ngày
    const groupedByDay = list.reduce((acc, item) => {
      const date = new Date(item.dt * 1000);
      const day = date.toISOString().split('T')[0];
      
      if (!acc[day]) {
        acc[day] = [];
      }
      
      acc[day].push(item);
      return acc;
    }, {});
    
    // Xử lý dữ liệu cho mỗi ngày
    Object.keys(groupedByDay).slice(0, days).forEach(day => {
      const dayData = groupedByDay[day];
      
      // Tính toán nhiệt độ trung bình, min, max
      const temps = dayData.map(d => d.main.temp);
      const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
      const minTemp = Math.min(...temps);
      const maxTemp = Math.max(...temps);
      
      // Tìm điều kiện thời tiết phổ biến nhất trong ngày
      const conditions = dayData.map(d => d.weather[0].main);
      const conditionCounts = conditions.reduce((acc, condition) => {
        acc[condition] = (acc[condition] || 0) + 1;
        return acc;
      }, {});
      
      const mostCommonCondition = Object.entries(conditionCounts)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0])[0];
      
      // Thêm vào kết quả
      dailyForecasts.push({
        date: day,
        avgTemp,
        minTemp,
        maxTemp,
        condition: mostCommonCondition,
        hourly: dayData,
        outfitConditions: this.mapWeatherToOutfitConditions({
          main: { temp: avgTemp },
          weather: [{ main: mostCommonCondition }]
        })
      });
    });
    
    return {
      city: forecastData.city,
      dailyForecasts
    };
  }
}

module.exports = WeatherService; 