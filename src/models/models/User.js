const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
    },
    address: {
      type: String,
    },
    avatar: {
      type: String,
    },
    bio: {
      type: String,
    },
    roles: {
      type: [String],
      enum: ['USER', 'ADMIN', 'MODERATOR'],
      default: ['USER'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'banned'],
      default: 'active',
    },
    lastLogin: {
      type: Date,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Mã hóa mật khẩu trước khi lưu
UserSchema.pre('save', async function (next) {
  const user = this;
  
  // Chỉ hash mật khẩu nếu nó đã được sửa đổi hoặc mới
  if (!user.isModified('password')) return next();
  
  try {
    // Tạo salt
    const salt = await bcrypt.genSalt(10);
    // Hash mật khẩu
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Phương thức so sánh mật khẩu
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema); 