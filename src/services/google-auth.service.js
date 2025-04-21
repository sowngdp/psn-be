'use strict';

const { OAuth2Client } = require('google-auth-library');
const userModel = require('../db/models/user.model');
const { BadRequestError, AuthFailureError } = require('../core/error.response');

// Khởi tạo OAuth client với Google Client ID từ env
const client = new OAuth2Client();

// Danh sách các client ID được phép
const ALLOWED_CLIENT_IDS = [
  process.env.GOOGLE_CLIENT_ID, // Web client ID
  process.env.GOOGLE_CLIENT_ID_IOS, // iOS client ID
  '354775201948-emedtm1qjqeo57u7u5f2tes7n3o4hg87.apps.googleusercontent.com', // iOS hardcoded (fallback)
  '354775201948-d39pqjko6u6s1p14pufe1c8aebqfsg88.apps.googleusercontent.com', // Web hardcoded (fallback)
];

class GoogleAuthService {
  /**
   * Xác thực token ID từ Google
   * @param {String} idToken - Token ID từ Google
   * @returns {Object} - Payload từ token
   */
  static async verifyGoogleToken(idToken) {
    console.log('idToken', idToken);
    
    let payload = null;
    let verificationError = null;

    // Thử xác thực với tất cả các client ID được phép
    for (const clientId of ALLOWED_CLIENT_IDS) {
      if (!clientId) continue; // Bỏ qua nếu clientId là null/undefined
      
      try {
        console.log('Trying client ID:', clientId);
        const ticket = await client.verifyIdToken({
          idToken,
          audience: clientId
        });
        
        payload = ticket.getPayload();
        console.log('Verification successful with client ID:', clientId);
        break; // Nếu xác thực thành công, thoát vòng lặp
      } catch (error) {
        verificationError = error;
        console.log('Verification failed with client ID:', clientId, error.message);
        // Thử với client ID tiếp theo
      }
    }

    if (payload) {
      return payload;
    } else {
      console.error('Google token verification failed with all client IDs:', verificationError);
      throw new AuthFailureError('Google token không hợp lệ');
    }
  }

  /**
   * Tìm hoặc tạo người dùng từ thông tin Google
   * @param {Object} googleUserData - Thông tin người dùng từ Google
   * @returns {Object} - User từ database
   */
  static async findOrCreateGoogleUser(googleUserData) {
    // Kiểm tra googleUserData
    if (!googleUserData || !googleUserData.email) {
      throw new BadRequestError('Thiếu thông tin từ Google');
    }

    const { sub: googleId, email, name, given_name, family_name, picture } = googleUserData;
    
    // Tạo tên đầy đủ từ thông tin Google nếu có
    const fullName = name || (given_name && family_name ? `${given_name} ${family_name}` : 
                             (given_name || family_name || email.split('@')[0]));

    // Tìm user theo googleId hoặc email
    let user = await userModel.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Nếu tìm thấy user theo email nhưng chưa có googleId
      if (!user.googleId) {
        user.googleId = googleId;
        user.provider = 'google';
        user.providerData = googleUserData;
        
        // Cập nhật tên và ảnh đại diện nếu trống
        if (!user.name && fullName) {
          user.name = fullName;
        }
        
        if (!user.avatar && picture) {
          user.avatar = picture;
        }
        
        // Nếu user chưa được xác thực, đánh dấu xác thực qua Google
        if (!user.isVerified) {
          user.isVerified = true;
        }
        
        await user.save();
      }
    } else {
      // Tạo user mới từ Google data
      user = await userModel.create({
        name: fullName,
        email,
        googleId,
        provider: 'google',
        providerData: googleUserData,
        avatar: picture || '',
        isVerified: true, // Auto-verified vì đã xác thực qua Google
        roles: ['USER']
      });
    }

    return user;
  }
}

module.exports = GoogleAuthService; 