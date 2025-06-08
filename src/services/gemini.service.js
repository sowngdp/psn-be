'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('../configs/env');
const { BadRequestError, InternalServerError } = require('../core/error.response');
const logger = require('../utils/logger');

class GeminiService {
  constructor() {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  /**
   * Chuẩn hóa category từ Gemini về đúng format của model
   * @param {string} category - Category từ Gemini
   * @returns {string} - Category đã được chuẩn hóa
   */
  normalizeCategoryMapping(category) {
    if (!category || typeof category !== 'string') {
      return 'other';
    }

    const categoryLower = category.toLowerCase().trim();
    
    // Mapping table để handle các variations
    const categoryMap = {
      // Accessories variations
      'accessories': 'accessory',
      'accessory': 'accessory',
      'phụ kiện': 'accessory',
      'bag': 'accessory',
      'bags': 'accessory',
      'túi': 'accessory',
      'túi xách': 'accessory',
      'jewelry': 'accessory',
      'watch': 'accessory',
      'hat': 'accessory',
      'belt': 'accessory',
      
      // Top variations
      'top': 'top',
      'tops': 'top',
      'shirt': 'top',
      'áo': 'top',
      'blouse': 'top',
      't-shirt': 'top',
      'tank': 'top',
      
      // Bottom variations
      'bottom': 'bottom',
      'bottoms': 'bottom',
      'pants': 'bottom',
      'quần': 'bottom',
      'shorts': 'bottom',
      'skirt': 'bottom',
      'jeans': 'bottom',
      
      // Outerwear variations
      'outerwear': 'outerwear',
      'jacket': 'outerwear',
      'coat': 'outerwear',
      'áo khoác': 'outerwear',
      'blazer': 'outerwear',
      'cardigan': 'outerwear',
      
      // Dress variations
      'dress': 'dress',
      'dresses': 'dress',
      'váy': 'dress',
      'gown': 'dress',
      
      // Footwear variations
      'footwear': 'footwear',
      'shoes': 'footwear',
      'giày': 'footwear',
      'boots': 'footwear',
      'sandals': 'footwear',
      'sneakers': 'footwear'
    };

    return categoryMap[categoryLower] || 'other';
  }

  /**
   * Chuẩn hóa season để match với model
   * @param {Array|string} seasons - Seasons từ Gemini
   * @returns {string} - Season đã được chuẩn hóa
   */
  normalizeSeasonMapping(seasons) {
    const validSeasons = ['spring', 'summer', 'fall', 'winter'];
    
    if (Array.isArray(seasons)) {
      // Lấy season đầu tiên hợp lệ
      for (const season of seasons) {
        if (validSeasons.includes(season.toLowerCase())) {
          return season.toLowerCase();
        }
      }
      return 'all';
    }
    
    if (typeof seasons === 'string' && validSeasons.includes(seasons.toLowerCase())) {
      return seasons.toLowerCase();
    }
    
    return 'all';
  }

  /**
   * Phân tích ảnh thời trang và tạo metadata chi tiết
   * @param {Buffer} imageBuffer - Buffer của ảnh cần phân tích
   * @param {string} mimeType - MIME type của ảnh (image/jpeg, image/png, etc.)
   * @returns {Promise<Object>} - Metadata chi tiết về món đồ
   * @throws {BadRequestError} - Nếu tham số không hợp lệ
   * @throws {InternalServerError} - Nếu có lỗi khi gọi Gemini API
   */
  async analyzeItemImage(imageBuffer, mimeType = 'image/png') {
    try {
      if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
        throw new BadRequestError('Invalid image buffer provided');
      }

      logger.info('Starting Gemini image analysis...');

      // Chuyển đổi buffer thành base64
      const base64Image = imageBuffer.toString('base64');

      // Prompt chi tiết để phân tích thời trang
      const prompt = `
Phân tích chi tiết món đồ thời trang trong ảnh này và trả về thông tin dưới dạng JSON với các trường sau:

{
  "category": "Danh mục chính - PHẢI chọn 1 trong: top, bottom, outerwear, dress, footwear, accessory, other",
  "subCategory": "Danh mục phụ cụ thể (áo thun, quần jean, váy maxi, etc.)",
  "colors": "màu chính",
  "style": "Phong cách (casual, formal, sporty, vintage, etc.)",
  "material": {
    "type": "Loại vải/chất liệu có thể nhận diện được",
    "texture": "Kết cấu (smooth, rough, knitted, etc.)",
    "thickness": "Độ dày (thin, medium, thick)"
  },

  "season": ["1 Mùa phù hợp nhất - chọn từ: spring, summer, fall, winter"],
  "occasion": "1 Dịp phù hợp nhất - chọn từ: casual, work, party, sport, etc.",
  "positions": "Vị trí của món đồ trong ảnh (như top-left, top-right, top-center, bottom-left, bottom-right, bottom-center, middle-left, middle-right, middle-center)",
  "description": "Mô tả ngắn về món đồ bằng tiếng Việt",
  "embedText": "văn bản mô tả tất cả các chi tiết của món đồ màu sắc, kiểu dáng, chất liệu,các thời tiết ,các mùa có thể sử dụng ,các dịp sử dụng, vị trí, các tính năng đặt biệt, style, category, subcategory, v.v.",
}

LƯU Ý QUAN TRỌNG:
- category PHẢI là một trong: top, bottom, outerwear, dress, footwear, accessory, other (KHÔNG dùng accessories)
- season PHẢI chọn từ: spring, summer, fall, winter  
- Hãy phân tích cẩn thận và trả về JSON hợp lệ
- Nếu không thể xác định một thuộc tính nào đó, hãy để null hoặc "unknown"
`;

      // Tạo part cho ảnh
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      };

      // Gọi Gemini API
      const result = await this.model.generateContent([prompt, imagePart]);
      const response = result.response;
      const text = response.text();

      logger.info('Gemini analysis completed');

      // Parse JSON response
      let metadata;
      try {
        // Tìm và extract JSON từ response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON found in response');
        }
        
        metadata = JSON.parse(jsonMatch[0]);
        
        // Chuẩn hóa dữ liệu để match với model
        if (metadata.category) {
          metadata.category = this.normalizeCategoryMapping(metadata.category);
        }
        
        if (metadata.season) {
          metadata.season = this.normalizeSeasonMapping(metadata.season);
        }
        
      } catch (parseError) {
        logger.error('Error parsing Gemini response:', parseError);
        logger.debug('Raw response:', text);
        
        // Fallback với metadata cơ bản
        metadata = {
          category: "other",
          subCategory: "unknown",
          colors: {
            primary: "unknown",
            secondary: [],
            pattern: "unknown"
          },
          style: "unknown",
          season: "all",
          description: "Không thể phân tích chi tiết",
          confidence: 0,
          rawResponse: text
        };
      }

      // Thêm timestamp và source
      metadata.analyzedAt = new Date().toISOString();
      metadata.source = 'gemini-ai';
      metadata.model = 'gemini-2.0-flash';

      return metadata;

    } catch (error) {
      logger.error('Error in Gemini image analysis:', error);
      
      if (error instanceof BadRequestError) {
        throw error;
      }
      
      // Check for specific Gemini API errors
      if (error.message && error.message.includes('API key')) {
        throw new InternalServerError('Gemini API configuration error');
      }
      
      throw new InternalServerError('Failed to analyze image with Gemini AI');
    }
  }

  /**
   * Tạo tên và mô tả cho món đồ dựa trên metadata
   * @param {Object} metadata - Metadata từ phân tích ảnh
   * @returns {Promise<Object>} - Tên và mô tả được tạo
   */
  async generateItemNameAndDescription(metadata) {
    try {
      const prompt = `
Dựa trên thông tin metadata sau của một món đồ thời trang, hãy tạo ra:
1. Tên ngắn gọn và hấp dẫn cho món đồ (dưới 50 ký tự)
2. Mô tả chi tiết và cuốn hút cho việc bán hàng (100-200 từ)

Metadata:
${JSON.stringify(metadata, null, 2)}

Trả về dưới dạng JSON:
{
  "name": "Tên món đồ ngắn gọn",
  "description": "Mô tả chi tiết và hấp dẫn bằng tiếng Việt"
}
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const generated = JSON.parse(jsonMatch[0]);
      
      return {
        name: generated.name || 'Món đồ thời trang',
        description: generated.description || 'Món đồ thời trang chất lượng cao'
      };

    } catch (error) {
      logger.error('Error generating item name and description:', error);
      
      // Fallback với tên và mô tả mặc định
      return {
        name: `${metadata.category || 'Món đồ'} ${metadata.colors?.primary || ''}`.trim(),
        description: `${metadata.description || 'Món đồ thời trang chất lượng cao'}`
      };
    }
  }
}

module.exports = new GeminiService(); 