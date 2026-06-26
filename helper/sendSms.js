const twilio = require('twilio');

module.exports.sendOTPPhone = async (phone, otp, action) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhone) {
      console.warn("Chưa cấu hình Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER). Bỏ qua gửi SMS thật.");
      return false;
    }

    const client = twilio(accountSid, authToken);

    let message = `Ma xac thuc OTP cua ban la: ${otp}. Vui long khong chia se cho ai.`;
    
    if (action === 'register') {
      message = `Tech & Glow: Ma OTP dang ky tai khoan cua ban la ${otp}.`;
    } else if (action === 'forgotPassword') {
      message = `Tech & Glow: Ma OTP khoi phuc mat khau cua ban la ${otp}.`;
    }

    // Chuyển đổi số điện thoại Việt Nam (09xxx) sang định dạng quốc tế (+849xxx)
    let formattedPhone = phone;
    if (phone.startsWith('0')) {
      formattedPhone = '+84' + phone.substring(1);
    }

    // In mã OTP ra màn hình Terminal để bạn dễ test (Dành cho bản dùng thử)
    console.log(`\n========================================`);
    console.log(`[DEV MODE] MÃ OTP CỦA SỐ ${formattedPhone} LÀ: ${otp}`);
    console.log(`========================================\n`);

    const response = await client.messages.create({
      body: message,
      from: twilioPhone,
      to: formattedPhone
    });

    console.log(`Đã gửi SMS tới ${formattedPhone}, SID: ${response.sid}`);
    return true;
  } catch (error) {
    console.error('Lỗi khi gửi SMS OTP (Twilio):', error);
    return false;
  }
};
