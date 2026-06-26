const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: String,
  phone: String,
  otp: String,
  action: {
    type: String, // 'register' or 'forgotPassword'
    required: true
  },
  expireAt: {
    type: Date,
    default: Date.now,
    index: { expires: '5m' } // Tự động xóa sau 5 phút
  }
}, {
  timestamps: true
});

const OTP = mongoose.model('OTP', otpSchema, 'otps');
module.exports = OTP;
