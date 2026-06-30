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
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
            <tr>
              <td width="70" valign="top">
                <img src="${item.thumbnail}" alt="Product" width="60" height="60" style="border-radius: 8px; border: 1px solid #e2e8f0; object-fit: cover; display: block;" />
              </td>
              <td valign="top" style="padding-left: 16px;">
                <div style="font-size: 15px; color: #0f172a; font-weight: 600; line-height: 1.4; margin-bottom: 4px;">${item.title}</div>
                ${item.variant ? `<div style="font-size: 13px; color: #64748b; margin-bottom: 8px;">Phân loại: ${item.variant}</div>` : ''}
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 8px;">
                  <tr>
                    <td align="left" style="font-size: 14px; color: #475569;">Số lượng: <strong>${item.quantity}</strong></td>
                    <td align="right" style="font-size: 15px; font-weight: 600; color: #0f172a;">${(item.newPrice || item.price).toLocaleString('vi-VN')} ₫</td>
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
      .replace(/{{shopName}}/g, 'NVH Mall') // Tên shop của bạn
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
      from: `"NVH Mall" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `[NVH Mall] Xác nhận đơn hàng #${order.orderCode}`,
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
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
            <tr>
              <td width="70" valign="top">
                <img src="${item.thumbnail}" alt="Product" width="60" height="60" style="border-radius: 8px; border: 1px solid #e2e8f0; object-fit: cover; display: block;" />
              </td>
              <td valign="top" style="padding-left: 16px;">
                <div style="font-size: 15px; color: #0f172a; font-weight: 600; line-height: 1.4; margin-bottom: 4px;">${item.title}</div>
                ${item.variant ? `<div style="font-size: 13px; color: #64748b; margin-bottom: 8px;">Phân loại: ${item.variant}</div>` : ''}
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 8px;">
                  <tr>
                    <td align="left" style="font-size: 14px; color: #475569;">Số lượng: <strong>${item.quantity}</strong></td>
                    <td align="right" style="font-size: 15px; font-weight: 600; color: #0f172a;">${(item.newPrice || item.price).toLocaleString('vi-VN')} ₫</td>
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
      from: `"NVH Mall" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `[NVH Mall] Hủy đơn hàng #${order.orderCode} thành công`,
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

    let subject = '[NVH Mall] Mã xác thực OTP';
    let message = 'Đây là mã xác thực OTP của bạn:';
    
    if (action === 'register') {
      subject = '[NVH Mall] Xác thực email đăng ký tài khoản';
      message = 'Cảm ơn bạn đã đăng ký tài khoản tại NVH Mall. Mã xác thực OTP của bạn là:';
    } else if (action === 'forgotPassword') {
      subject = '[NVH Mall] Khôi phục mật khẩu';
      message = 'Bạn đã yêu cầu khôi phục mật khẩu. Mã xác thực OTP của bạn là:';
    }

    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #0f172a; padding: 32px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">NVH Mall</h1>
        </div>
        <div style="padding: 40px;">
          <p style="font-size: 16px; color: #334155; margin-top: 0; margin-bottom: 24px; line-height: 1.5;">Xin chào,</p>
          <p style="font-size: 16px; color: #334155; margin-bottom: 32px; line-height: 1.5;">${message}</p>
          <div style="text-align: center; margin: 40px 0; background-color: #f8fafc; padding: 32px; border-radius: 12px; border: 1px dashed #cbd5e1;">
            <span style="display: inline-block; font-size: 42px; font-weight: 800; color: #2563eb; letter-spacing: 12px; margin-left: 12px;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #64748b; margin-bottom: 8px;">Mã này sẽ hết hạn sau <strong>5 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai để đảm bảo bảo mật tài khoản.</p>
          <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
        </div>
        <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">© 2026 NVH Mall. All rights reserved.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"NVH Mall" <${process.env.EMAIL_USER}>`,
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