# 🛒 NVH Mall - Nền Tảng Thương Mại Điện Tử Hiện Đại (Enterprise-Grade)

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)

**NVH Mall** là hệ thống thương mại điện tử toàn diện, được xây dựng theo kiến trúc hiện đại, tập trung vào hiệu suất cao, bảo mật chặt chẽ và tích hợp giao tiếp thời gian thực (WebSockets). Dự án đáp ứng đầy đủ tiêu chuẩn của một đồ án tốt nghiệp xuất sắc và một sản phẩm thương mại thực tế.

---

## ✨ Các Tính Năng Nổi Bật (Key Features)

### 🤖 Công Nghệ Tiên Tiến (Advanced Integrations)
- **Giao tiếp thời gian thực (Socket.io):** Hỗ trợ tính năng nhắn tin chăm sóc khách hàng trực tuyến, thông báo đơn hàng realtime.
- **Đăng nhập Mạng xã hội (OAuth 2.0):** Tích hợp Passport.js cho phép đăng nhập nhanh qua **Google** và **Facebook**.
- **SMS & Email Marketing:** Tích hợp **Twilio** (gửi mã OTP qua điện thoại) và **Nodemailer** (gửi email xác nhận đơn hàng chuẩn HTML Premium).
- **Lưu trữ Cloud (Cloudinary):** Tối ưu hóa việc tải lên và lưu trữ hình ảnh sản phẩm/avatar người dùng.

### 🛍️ Dành Cho Khách Hàng (Client-Side)
- **Quản Lý Giỏ Hàng & Thanh Toán:** Quy trình Checkout chuyên nghiệp, hỗ trợ nhiều phương thức thanh toán trực tuyến.
- **Flash Sale & Danh Mục Động:** Giao diện Flash Sale với đồng hồ đếm ngược, tự động cập nhật trạng thái "Đang bán chạy".
- **Chương trình Khách hàng thân thiết (Loyalty):** Tích điểm thưởng sau mỗi lần mua hàng.
- **Quản Lý Tài Khoản:** Quản lý thông tin cá nhân, thay đổi mật khẩu, theo dõi lịch sử đơn hàng và yêu cầu hủy/hoàn trả đơn hàng.
- **Thiết Kế Tối Ưu (Responsive):** Giao diện TailwindCSS hiện đại, co giãn hoàn hảo trên thiết bị di động (Mobile-first).

### ⚙️ Dành Cho Quản Trị (Admin-Side)
- **Dashboard Thống Kê Nâng Cao:** Trực quan hóa dữ liệu doanh thu, số lượng đơn hàng, người dùng bằng biểu đồ.
- **Quản lý Sản Phẩm & Phân Loại:** Thêm/sửa/xóa sản phẩm, trình soạn thảo văn bản phong phú (TinyMCE) cho mô tả sản phẩm.
- **Cấu hình Hệ thống & SEO:** Chỉnh sửa linh hoạt giao diện cài đặt chung, quản lý URL thân thiện (Slug-updater).
- **Phân Quyền Chi Tiết (RBAC):** Phân quyền quản trị viên, nhân viên sale, chăm sóc khách hàng.

---

## 🛡️ Hệ Thống Bảo Mật (Security Measures)

Dự án áp dụng các tiêu chuẩn bảo mật khắt khe nhất để chống lại các lỗ hổng web phổ biến:
- **Helmet.js:** Đặt các HTTP Header bảo mật.
- **XSS-Clean:** Vô hiệu hóa mã độc XSS từ input của người dùng.
- **Express-Mongo-Sanitize:** Ngăn chặn lỗi bảo mật NoSQL Injection.
- **Express-Rate-Limit:** Chống tấn công DDOS và Brute Force bằng cách giới hạn số lượt request.
- **Bcrypt & JWT:** Mã hóa mật khẩu một chiều mạnh mẽ và quản lý phiên đăng nhập an toàn bằng JSON Web Tokens.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### Backend
- **Core:** Node.js, Express.js
- **Database:** MongoDB (với Mongoose)
- **Authentication:** Passport.js, JWT, Bcrypt
- **Cloud & 3rd Party:** Cloudinary, Twilio, Nodemailer

### Frontend
- **Template Engine:** Pug
- **Styling:** Tailwind CSS, Bootstrap 5, Autoprefixer
- **Interactivity:** Vanilla JavaScript, Socket.io (Client)
- **Editor:** TinyMCE

---

## 🚀 Hướng Dẫn Cài Đặt (Installation & Setup)

### 1. Yêu cầu hệ thống
- Node.js (phiên bản v18.x trở lên).
- MongoDB (Local hoặc MongoDB Atlas).

### 2. Tải mã nguồn về máy
```bash
git clone https://github.com/ahaha1309/product-management.git
cd product-management
```

### 3. Cài đặt thư viện (Dependencies)
```bash
npm install
```

### 4. Thiết lập biến môi trường (.env)
Tạo một file `.env` ở thư mục gốc của dự án và khai báo toàn bộ các khóa API cần thiết:
```env
# Server & Database
PORT=3000
MONGO_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/product-management

# Security & Sessions
SESSION_SECRET=your_super_secret_session_key

# Cấu hình Gửi Email (Nodemailer)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cấu hình Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Cấu hình OAuth (Google/Facebook)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_fb_app_id
FACEBOOK_APP_SECRET=your_fb_app_secret

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

### 5. Khởi chạy máy chủ (Run the server)
Chạy script tự động build CSS Tailwind và khởi động Nodemon:
```bash
npm start
```
Mở trình duyệt và truy cập: `http://localhost:3000`

---

## 📁 Cấu Trúc Thư Mục (Folder Structure)

```text
├── config/              # Kết nối Database (MongoDB)
├── controller/          # Logic điều khiển (Client & Admin controllers)
├── helper/              # Các hàm tiện ích (SendMail, OTP, Cloudinary...)
├── middleware/          # Xử lý trung gian (Auth, Security, File Upload)
├── models/              # Lược đồ cơ sở dữ liệu (Mongoose Schemas)
├── public/              # Tài nguyên tĩnh (Tailwind CSS, JS, Images, Uploads)
├── routes/              # Định nghĩa đường dẫn API và Web
├── template/            # Các mẫu HTML Premium (Email Marketing...)
├── validate/            # Logic kiểm tra dữ liệu đầu vào (Validation)
├── views/               # Giao diện hiển thị (Pug template)
│   ├── admin/           # Bảng quản trị
│   └── client/          # Giao diện người dùng
├── index.js             # File gốc khởi chạy ứng dụng
└── package.json         # Khai báo cấu hình dự án và thư viện
```

---

## 🤝 Bản Quyền & Hỗ Trợ
Dự án được xây dựng và phát triển với quy chuẩn khắt khe, áp dụng các best practices mới nhất trong lĩnh vực phát triển web.  
**Bản quyền © 2026 NVH Mall.**
