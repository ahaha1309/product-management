const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

module.exports.sendOrderConfirmationEmail = async (order, user) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
      }
    });

    // 1. TẠO HTML CHO DANH SÁCH SẢN PHẨM (Mô phỏng 1 row bảng trong email)
    let productListHTML = '';
    if (order.products && order.products.length > 0) {
      order.products.forEach(item => {
        productListHTML += `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
            <tr>
              <td width="70" valign="top">
                <img src="${item.thumbnail}" alt="Product" width="60" height="60" style="border-radius: 4px; border: 1px solid #f0f0f0; object-fit: cover;" />
              </td>
              <td valign="top" style="padding-left: 10px;">
                <div style="font-size: 13px; color: #333; line-height: 1.4; margin-bottom: 4px;">${item.title}</div>
                ${item.variant ? `<div style="font-size: 12px; color: #888; margin-bottom: 8px;">Phân loại: ${item.variant}</div>` : ''}
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 5px;">
                  <tr>
                    <td align="left" style="font-size: 14px; color: #161823;">${(item.newPrice || item.price).toLocaleString('vi-VN')}₫</td>
                    <td align="right" style="font-size: 13px; color: #555;">x${item.quantity}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `;
      });
    }

    // 2. Tính toán tiền (Giả sử tổng đơn hàng là amount, phí ship 30k)
    // Tùy theo logic lưu DB của bạn mà chỉnh sửa biến chỗ này
    const shippingFee = 30000;
    const subTotal = order.amount - shippingFee; 
    const discount = 0; // Nếu có voucher thì trừ vào đây

    // 3. Đọc và thay thế template
    const templatePath = path.join(__dirname, '../template/orderEmail.html');
    let html = fs.readFileSync(templatePath, 'utf8');

    html = html
      .replace(/{{userName}}/g, user.fullName || 'Bạn')
      .replace(/{{shopName}}/g, 'Bách Mỹ Shop') // Tên shop của bạn
      .replace(/{{productListHTML}}/g, productListHTML)
      .replace(/{{orderCode}}/g, order.orderCode)
      .replace(/{{orderDate}}/g, new Date(order.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'short', day: 'numeric' }))
      .replace(/{{orderLink}}/g, `http://product-managementl.vercel.app/order/detail/${order._id}`) // Sửa localhost thành domain thật của bạn sau này
      .replace(/{{subTotal}}/g, subTotal.toLocaleString('vi-VN'))
      .replace(/{{shippingFee}}/g, shippingFee.toLocaleString('vi-VN'))
      .replace(/{{discount}}/g, discount.toLocaleString('vi-VN'))
      .replace(/{{totalAmount}}/g, order.amount.toLocaleString('vi-VN'))
      .replace(/{{fullName}}/g, user.fullName)
      .replace(/{{phone}}/g, user.phone || 'Chưa cập nhật SĐT')
      .replace(/{{address}}/g, user.address || 'Chưa cập nhật địa chỉ');

    // 4. Gửi Mail (Không cần gửi QR nữa vì template này xịn rồi)
    const mailOptions = {
      from: `"Tech & Glow Shop" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `[Tech & Glow] Xác nhận đơn hàng #${order.orderCode}`,
      html: html
    };

    await transporter.sendMail(mailOptions);
    console.log(`Đã gửi email Tiktok-style cho ${user.email}`);

  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
  }
};

module.exports.sendOrderCancellationEmail = async (order, user) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
      }
    });

    let productListHTML = '';
    if (order.products && order.products.length > 0) {
      order.products.forEach(item => {
        productListHTML += `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
            <tr>
              <td width="70" valign="top">
                <img src="${item.thumbnail}" alt="Product" width="60" height="60" style="border-radius: 4px; border: 1px solid #f0f0f0; object-fit: cover;" />
              </td>
              <td valign="top" style="padding-left: 10px;">
                <div style="font-size: 13px; color: #333; line-height: 1.4; margin-bottom: 4px;">${item.title}</div>
                ${item.variant ? `<div style="font-size: 12px; color: #888; margin-bottom: 8px;">Phân loại: ${item.variant}</div>` : ''}
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 5px;">
                  <tr>
                    <td align="left" style="font-size: 14px; color: #161823;">${(item.newPrice || item.price).toLocaleString('vi-VN')}₫</td>
                    <td align="right" style="font-size: 13px; color: #555;">x${item.quantity}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `;
      });
    }

    const templatePath = path.join(__dirname, '../template/cancelEmail.html');
    let html = fs.readFileSync(templatePath, 'utf8');

    html = html
      .replace(/{{userName}}/g, user.fullName || 'Bạn')
      .replace(/{{productListHTML}}/g, productListHTML)
      .replace(/{{orderCode}}/g, order.orderCode)
      .replace(/{{cancelDate}}/g, new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'short', day: 'numeric' }))
      .replace(/{{orderLink}}/g, `http://product-managementl.vercel.app/product`);

    const mailOptions = {
      from: `"Tech & Glow Shop" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `[Tech & Glow] Hủy đơn hàng #${order.orderCode} thành công`,
      html: html
    };

    await transporter.sendMail(mailOptions);
    console.log(`Đã gửi email báo hủy đơn cho ${user.email}`);

  } catch (error) {
    console.error('Lỗi khi gửi email hủy:', error);
  }
};

module.exports.sendOTPEmail = async (email, otp, action) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
      }
    });

    let subject = '[Tech & Glow] Mã xác thực OTP';
    let message = 'Đây là mã xác thực OTP của bạn:';
    
    if (action === 'register') {
      subject = '[Tech & Glow] Xác thực email đăng ký tài khoản';
      message = 'Cảm ơn bạn đã đăng ký tài khoản tại Tech & Glow. Mã xác thực OTP của bạn là:';
    } else if (action === 'forgotPassword') {
      subject = '[Tech & Glow] Khôi phục mật khẩu';
      message = 'Bạn đã yêu cầu khôi phục mật khẩu. Mã xác thực OTP của bạn là:';
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #6366f1; text-align: center;">Tech & Glow</h2>
        <p style="font-size: 16px; color: #333;">Xin chào,</p>
        <p style="font-size: 16px; color: #333;">${message}</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="display: inline-block; padding: 15px 30px; font-size: 32px; font-weight: bold; color: #fff; background-color: #6366f1; border-radius: 8px; letter-spacing: 5px;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #888;">Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
        <p style="font-size: 14px; color: #888;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
      </div>
    `;

    const mailOptions = {
      from: `"Tech & Glow Shop" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: html
    };

    await transporter.sendMail(mailOptions);
    console.log(`Đã gửi email OTP cho ${email}`);

  } catch (error) {
    console.error('Lỗi khi gửi email OTP:', error);
  }
};