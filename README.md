# 🛒 NVH Mall - Nền Tảng Thương Mại Điện Tử Hiện Đại

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white)

**NVH Mall** là một hệ thống website thương mại điện tử chuyên nghiệp được xây dựng bằng hệ sinh thái Node.js. Dự án cung cấp một giao diện mua sắm mượt mà, tối ưu hóa cho cả thiết bị di động (Responsive) và máy tính để bàn, tích hợp đầy đủ các tính năng phức tạp của một hệ thống bán lẻ như Shopee, Thế Giới Di Động hay Hoàng Hà Mobile.

---

## ✨ Tính Năng Nổi Bật (Features)

### Dành Cho Khách Hàng (Client-Side)
- **🛍️ Quản Lý Giỏ Hàng & Đặt Hàng:** Thêm/sửa/xóa sản phẩm trong giỏ hàng, tự động tính tổng tiền, quy trình Checkout chuyên nghiệp.
- **❤️ Danh Sách Yêu Thích (Wishlist):** Lưu các sản phẩm yêu thích kèm hiệu ứng badge số đếm thời gian thực trên thanh điều hướng.
- **⚡ Flash Sale Thông Minh:** Giao diện Flash Sale với thanh trượt tự động, đếm ngược thời gian và thanh trạng thái "Đang bán chạy".
- **🔍 Bộ Lọc & Tìm Kiếm Nâng Cao:** Tìm kiếm theo từ khóa, lọc sản phẩm theo mức giá, danh mục, và đánh giá sao trực tiếp không cần load lại trang.
- **📱 Thiết Kế Đáp Ứng (Responsive UI):** Giao diện tự động co giãn, Sidebar Offcanvas cho thiết bị di động mang lại trải nghiệm mượt mà.
- **👤 Quản Lý Tài Khoản:** Đăng nhập, đăng ký, quên mật khẩu, cập nhật thông tin người dùng và theo dõi lịch sử đơn hàng.

### Dành Cho Quản Trị (Admin-Side)
- Bảng điều khiển (Dashboard) thống kê doanh thu và đơn hàng.
- Quản lý danh mục (Categories), quản lý sản phẩm (Products), thùng rác (Recycle Bin).
- Phân quyền người dùng (Role-based access control), quản lý nhân viên.
- Chỉnh sửa linh hoạt giao diện cài đặt chung của hệ thống.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### Backend:
- **Node.js** & **Express.js**: Cung cấp kiến trúc máy chủ mạnh mẽ và định tuyến (routing).
- **MongoDB** & **Mongoose**: Quản lý cơ sở dữ liệu NoSQL linh hoạt, bảo mật cao.
- **Bcrypt / JWT**: Mã hóa mật khẩu và xử lý token phân quyền.

### Frontend:
- **Pug**: Template Engine biên dịch HTML tinh gọn, kế thừa cấu trúc (layouts) thông minh.
- **CSS3 & Bootstrap 5**: Xây dựng bố cục nhanh chóng, Responsive UI, kết hợp Custom CSS theo phong cách tối giản.
- **Vanilla JavaScript**: Xử lý logic phía Client (AJAX giỏ hàng, thanh trượt Flash sale, bộ lọc động...).

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy (Installation)

### 1. Yêu cầu hệ thống
- Node.js (phiên bản 14.x hoặc mới hơn).
- MongoDB (đã cài đặt local hoặc sử dụng MongoDB Atlas).
- Git.

### 2. Tải mã nguồn về máy
```bash
git clone <đường-dẫn-repo-của-bạn>
cd product-management
```

### 3. Cài đặt thư viện (Dependencies)
```bash
npm install
```

### 4. Thiết lập biến môi trường (.env)
Tạo một file `.env` ở thư mục gốc của dự án và khai báo các biến sau:
```env
PORT=3002
MONGO_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/product-management?retryWrites=true&w=majority
SESSION_SECRET=my_super_secret_key
# Cấu hình Gửi Email (Tùy chọn)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 5. Khởi chạy máy chủ (Run the server)
Môi trường phát triển (tự động khởi động lại khi sửa code):
```bash
npm run dev
```
Hoặc môi trường thực tế (Production):
```bash
npm start
```
Mở trình duyệt và truy cập: `http://localhost:3002`

---

## 📁 Cấu Trúc Thư Mục (Folder Structure)

```text
├── config/              # Kết nối Database và các thiết lập hệ thống
├── controller/          # Các Controller xử lý logic chính (Client & Admin)
├── helper/              # Các hàm tiện ích (Pug helpers, Pagination, Mailer...)
├── middleware/          # Middleware kiểm tra đăng nhập, xác thực, upload file
├── models/              # Schema định nghĩa cấu trúc dữ liệu MongoDB
├── public/              # Thư mục tĩnh chứa CSS, Images, và Client-side JS
├── routes/              # Khai báo đường dẫn API và URL cho Client & Admin
├── template/            # Template dựng sẵn (nếu có)
├── validate/            # Logic bắt lỗi, kiểm tra tính hợp lệ của Form
├── views/               # Chứa các file giao diện Pug (được chia layout rõ ràng)
│   ├── admin/           # Giao diện cho ban quản trị
│   └── client/          # Giao diện dành cho khách hàng mua sắm
├── .env                 # File biến môi trường (không push lên git)
├── index.js             # File gốc khởi chạy máy chủ Express
└── package.json         # Khai báo cấu hình dự án và dependencies
```

---

## 🤝 Hỗ Trợ & Đóng Góp
Nếu bạn tìm thấy lỗi (bug) hoặc muốn đóng góp ý tưởng phát triển dự án, vui lòng tạo **Issue** hoặc gửi **Pull Request**. Mọi ý kiến đóng góp của bạn đều được trân trọng!

**Dự án được xây dựng và phát triển bởi NVH Mall. Bản quyền © 2024.**
