# BÁO CÁO PHÂN TÍCH CHI TIẾT TOÀN BỘ MÃ NGUỒN DỰ ÁN
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ NODE.JS (MVC NÂNG CAO)

*Tài liệu này là bản gộp ĐẦY ĐỦ VÀ CHI TIẾT NHẤT của toàn bộ 12 phần phân tích trước đó, đi sâu vào từng dòng code, từng thuật toán và thiết kế kiến trúc hệ thống.*

---

## PHẦN 1: TỔNG QUAN KIẾN TRÚC DỰ ÁN

Dự án được thiết kế theo mô hình **MVC (Model - View - Controller)**.
1. **Model:** Tương tác với cơ sở dữ liệu MongoDB bằng Mongoose (ODM).
2. **Controller:** Xử lý nghiệp vụ (Business logic), chia làm 2 luồng rõ rệt là Admin (Quản trị) và Client (Khách hàng).
3. **View:** Render giao diện bằng Template Engine `Pug` (trước đây là Jade).

**Điểm nhấn công nghệ:**
- Môi trường: Node.js, Express.js.
- CSDL: MongoDB (NoSQL).
- Tích hợp Thanh toán: Cổng VNPAY.
- Trí tuệ nhân tạo (AI): Google Gemini AI làm Chatbot bán hàng.
- Real-time: `Socket.io` hỗ trợ Chat trực tuyến.
- Xác thực: JWT tự chế bằng Token và OAuth2.0 bằng `Passport.js` (Google, Facebook).
- Bảo mật: `helmet`, `xss-clean`, `express-mongo-sanitize`, `express-rate-limit`.

---

## PHẦN 2: PHÂN TÍCH TẦNG DỮ LIỆU (MODELS)

Thư mục `models/` chứa 20 tệp định nghĩa Schema (cấu trúc bảng). Hệ thống sử dụng Mongoose để ánh xạ Javascript Object vào MongoDB.

### 2.1. Nhóm Quản trị (Admin) & Người dùng (User)
*   **`account.model.js` (Tài khoản Admin):**
    *   Lưu trữ `fullName`, `email`, `password` (đã mã hóa), `token` (dùng để xác thực cookie thay vì JWT truyền thống), và `role_id` (Khóa ngoại tham chiếu đến bảng Roles).
    *   Thiết kế Xóa mềm (Soft Delete): Trường `deleted: { type: Boolean, default: false }`. Khi admin xóa 1 tài khoản, code không dùng `deleteOne()` mà chỉ chuyển `deleted` thành `true`.
*   **`roles.model.js` (Nhóm quyền):**
    *   Chứa `title` (Ví dụ: Giám đốc, Quản lý kho) và `permissions` (Kiểu Array).
    *   Mảng `permissions` lưu các chuỗi Text như `['products_view', 'products_edit', 'orders_delete']`. Đây là thiết kế Phân quyền rất thông minh, giúp vẽ ra ma trận phân quyền linh hoạt trên UI.
*   **`user.model.js` (Tài khoản Khách hàng):**
    *   Lưu thông tin khách mua hàng, trạng thái `status: "active" | "inactive"`, lịch sử mua hàng. Tương tự account, luôn có `deleted: false`.

### 2.2. Nhóm Sản phẩm & Danh mục (Products & Categories)
*   **`product.model.js`:**
    *   Các trường cơ bản: `title`, `description`, `price`, `discountPercentage`, `stock`, `thumbnail`.
    *   `slug`: Đường dẫn thân thiện SEO (Ví dụ: `iphone-15-pro-max`). Dùng thư viện `mongoose-slug-updater` để tự động biến đổi `title` thành `slug` và đảm bảo tính duy nhất (unique).
    *   `position`: Vị trí hiển thị, kiểu Number. Admin có thể kéo thả hoặc nhập số để đổi thứ tự xuất hiện trên web.
*   **`product-category.model.js`:**
    *   Chứa trường `parent_id`. Đây là thiết kế **Cấu trúc dữ liệu dạng Cây (Tree)**. Một danh mục "Điện thoại" có thể là con của "Đồ điện tử" thông qua `parent_id`.

### 2.3. Nhóm Giao dịch (Cart & Order)
*   **`cart.model.js`:**
    *   Lưu `cartId` (một chuỗi hash ngẫu nhiên lưu ở Cookie trình duyệt người dùng khi chưa đăng nhập).
    *   Mảng `products`: Chứa `product_id` và `quantity`.
*   **`orders.model.js`:**
    *   Lưu `userInfo` (Tên, SĐT, Địa chỉ giao hàng).
    *   Mảng `products`: Chứa danh sách mặt hàng, **nhưng có sao chép cứng (hard-copy) `price` và `discountPercentage` tại thời điểm mua**. Điều này cực kỳ quan trọng: Nếu sau này giá sản phẩm tăng lên, lịch sử đơn hàng cũ vẫn giữ nguyên giá cũ.
    *   Trường `paymentMethod` (COD, VNPAY) và trạng thái đơn hàng.

---

## PHẦN 3: PHÂN TÍCH TẦNG NGHIỆP VỤ - ADMIN (CONTROLLERS)

Đây là não bộ của hệ thống quản lý. Các file nằm trong thư mục `controller/admin/`.

### 3.1. Phân tích chức năng Quản lý Sản phẩm (`product.controller.js`)
*   **Hàm `index()` (Trang danh sách):**
    *   Tích hợp 4 tính năng trong 1 API: Phân trang (Pagination), Tìm kiếm Regex, Lọc theo trạng thái (Active/Inactive), và Sắp xếp (Sort).
    *   **Phân trang:** Tính toán số lượng bỏ qua `skip = (currentPage - 1) * limit`.
*   **Hàm `changeMulti()` (Đổi trạng thái hàng loạt):**
    *   Sử dụng switch-case để bắt các hành động: `active`, `inactive`, `delete-all`, `change-position`.
    *   Sử dụng lệnh `Product.updateMany({ _id: { $in: ids } }, { status: '...' })` để cập nhật một loạt sản phẩm mà không cần vòng lặp for, tối ưu hóa I/O MongoDB.
*   **Hàm `createPost()` (Thêm mới sản phẩm):**
    *   Xử lý ảnh Upload. Giá trị ảnh nhị phân đã được Middleware Cloudinary đẩy lên mạng, Controller chỉ việc lưu chuỗi URL ảnh vào DB.

### 3.2. Phân tích Bảng Điều Khiển (`dashboard.controller.js`)
*   **Hàm `dashboard()`:**
    *   Sử dụng lệnh `.countDocuments()` siêu tốc của MongoDB để đếm số lượng Sản phẩm hoạt động/không hoạt động, số Đơn hàng, số User. Trả về giao diện để vẽ các thẻ Card thống kê nhanh.

### 3.3. Phân quyền và Bảo mật Admin (`role.controller.js` & `account.controller.js`)
*   **Hàm `permissionsPatch()`:**
    *   Nhận về một mảng JSON chứa danh sách quyền lợi mới. Loop qua từng Role và dùng `.updateOne()` để ghi đè lại mảng permissions mới.
*   **Hàm `loginPost()` (Đăng nhập):**
    *   Tra cứu DB bằng Email.
    *   So sánh Mật khẩu bằng thư viện `md5` (Nên nâng cấp lên bcrypt trong tương lai).
    *   Trả về Cookie chứa `token` ngẫu nhiên 32 ký tự, thời hạn sống 30 ngày.

---

## PHẦN 4: PHÂN TÍCH TẦNG NGHIỆP VỤ - CLIENT (CONTROLLERS)

Tương tác trực tiếp với khách mua hàng.

### 4.1. Mua sắm và Giỏ hàng (`cart.controller.js`)
*   **Hàm `addPost()`:**
    *   Nhận Request chứa `productId` và số lượng.
    *   Thuật toán: Kiểm tra trong giỏ hàng hiện tại (truy vấn bằng `cartId` lấy từ Cookie) đã có sản phẩm này chưa.
    *   Nếu có rồi: Bắn lệnh `$inc: { "products.$.quantity": quantity }` để cộng dồn số lượng.
    *   Nếu chưa có: Bắn lệnh `$push: { products: { product_id, quantity } }` để nhét sản phẩm mới vào mảng.

### 4.2. Thanh toán & Webhook VNPAY (`order.controller.js`, `checkout.controller.js`)
*   **Luồng Thanh toán VNPAY:**
    *   Tạo URL: Dùng mã bảo mật `vnp_HashSecret`, ghép với số tiền (`vnp_Amount`), mã đơn hàng, ngày giờ. Sử dụng thuật toán HmacSHA512 để ký điện tử (Signature) rồi đẩy khách sang trang VNPAY.
    *   **Hàm `vnpayReturn()`:** Lắng nghe VNPAY gọi về sau khi khách quét mã QR xong. Hệ thống nhặt tất cả tham số trả về, loại bỏ chữ ký cũ, tự tính toán lại chữ ký mới. Nếu khớp -> Thanh toán thành công -> Đổi `paymentStatus` của Đơn hàng thành "Paid" -> Gửi mail tự động.

### 4.3. Đăng ký & Xác thực OTP (`user.controller.js`)
*   **Quên Mật Khẩu (Forgot Password):**
    *   Khách nhập Email. Hệ thống sinh 1 mã OTP 6 số ngẫu nhiên lưu vào bảng `Forgot Password` (kèm thời gian hết hạn là 3 phút).
    *   Gọi Helper gửi mã OTP qua Email cho khách. Khách nhập mã lên Web.
    *   Xác minh đúng mã OTP -> Cấp quyền cho khách đặt lại mật khẩu mới.

---

## PHẦN 5: PHÂN TÍCH TẦNG KHIÊN GIÁP BẢO MẬT (MIDDLEWARES)

Nằm ở thư mục `middleware/`, đây là chốt chặn kiểm duyệt trước khi Request lọt vào Controller.

### 5.1. Chặn Đăng nhập (`admin/auth.middleware.js`)
*   Đọc Cookie `token`. Nếu không có -> Đá văng ra trang Login.
*   Nếu có Token, dò tìm `Account` trong DB. Bóc luôn cả bảng `Roles` đính kèm.
*   **Phân quyền tinh vi:** Gắn `res.locals.user` và `res.locals.role`. Trải khắp các View Pug, nếu muốn ẩn/hiện nút "Xóa", hệ thống chỉ cần check `if(role.permissions.includes("products_delete"))`. Đảm bảo nhân viên kho không thể xóa sản phẩm.

### 5.2. Luồng Xử lý Ảnh Cloudinary (`uploadCloud.middleware.js`)
*   Khi Form gửi ảnh lên, file được lưu tạm trên RAM máy chủ Node.js (dưới dạng Buffer).
*   Middleware sử dụng `streamifier` tạo ra một dòng suối dữ liệu (Stream) chảy thẳng vào API của máy chủ Cloudinary.
*   Trả về URL ảnh trên mạng. Kỹ thuật này giúp Server không bị đầy ổ cứng và không tốn chi phí thuê ổ cứng đắt tiền.

### 5.3. Bơm dữ liệu Global Client (`category.middleware.js`)
*   Lấy toàn bộ cây danh mục Sản phẩm. Gắn vào `res.locals.layoutCategoryProducts`.
*   Vì thư mục dùng ở Header của **tất cả** các trang (Home, Product, Cart...), nên đưa vào Middleware cấp App để tránh lặp lại dòng code truy vấn ở 17 file Controller.

---

## PHẦN 6: PHÂN TÍCH TẦNG CÔNG CỤ PHỤ TRỢ (HELPERS)

Thư mục `helper/` chứa 14 file cung cấp các "Vũ khí hạng nặng" cho hệ thống.

### 6.1. Trợ lý Trí tuệ Nhân tạo (`chatbot.js`)
*   Đây là **"Bộ Não"** AI của dự án, kết nối API Google Gemini Flash.
*   **Cơ chế Rate Limit (Dòng 22-47):** Khống chế số lần nhắn tin (10 tin/phút). Chống khách hàng dùng Tool Spam cào sập API AI.
*   **Cơ chế RAG (Retrieval-Augmented Generation):** Khi khách hỏi "Shop có iPhone 15 không?", AI không tự bịa câu trả lời. Thuật toán `searchProducts()` lập tức chọc vào DB MongoDB lấy ra Tên, Giá, Link của iPhone 15, nhồi vào ngữ cảnh (Context Prompt) ép AI phải đọc dữ liệu này và trả lời thật chính xác cho khách.

### 6.2. Bộ xử lý Dữ liệu BI Dashboard (`analytics.js`)
*   Sử dụng **MongoDB Aggregation Pipeline** (Cỗ máy nghiền dữ liệu mạnh nhất của NoSQL).
*   Hàm `getTopCategories()`: Sử dụng `$lookup` (Tương đương lệnh JOIN trong SQL). Bảng Order nối với bảng Product, sau đó lại nối tiếp với bảng Category. Cuối cùng dùng `$group` và `$sum` để tính tổng Doanh thu theo từng Danh mục.

### 6.3. Tương tác Người dùng: Gửi Mail & Hiệu ứng Chim mồi
*   **`sendEmail.js`:** Tích hợp `nodemailer`. Tự động tạo khối HTML chứa bảng hóa đơn đẹp mắt, đính kèm giá tiền, ảnh sản phẩm, rồi gửi thẳng vào hộp thư Gmail của khách khi Thanh toán xong.
*   **`social-proof.js`:** Tạo hiệu ứng FO-MO (Sợ bỏ lỡ). Cung cấp hàm `getLiveOrders()` lấy 5 đơn hàng vừa được mua cách đây vài phút để hiện popup góc trái: "Anh Nguyễn Văn A vừa mua iPhone 15 Pro".

### 6.4. Các thuật toán tiện ích khác
*   **`createTree.js` & `product-category.js`:** Áp dụng thuật toán **Đệ Quy (Recursion)**. Hàm gọi lại chính nó liên tục để vét trọn vẹn toàn bộ các nhánh con, cháu, chắt của một Danh mục Gốc.
*   **`pagination.js`:** Đóng gói biểu thức tính Tổng số trang: `Math.ceil(totalItem / limitItem)`.
*   **`generate.js`:** Cấp phát Random Token và Mã OTP bằng thư viện gốc `crypto` của Node.js.

---

## PHẦN 7: CẤU HÌNH GỐC (CONFIG) VÀ HẠT NHÂN (INDEX.JS)

### 7.1. Tối ưu Serverless (`config/database.js`)
*   Triển khai lên nền tảng Serverless (Vercel), Node.js server sẽ liên tục bị tắt bật.
*   Giải pháp: Tác giả tạo ra `global.mongoose`. Nó sẽ Cache (Lưu vào bộ nhớ đệm toàn cục) đường truyền kết nối (Connection). Lần khởi động sau, App sẽ tái sử dụng đường truyền cũ thay vì đẻ ra đường truyền mới. Khắc phục triệt để lỗi "Too many connections" sập MongoDB.

### 7.2. Cấu hình SSO Đăng nhập nhanh (`config/passport.js`)
*   Triển khai tiêu chuẩn bảo mật xác thực chéo OAuth2.0 qua `passport-google-oauth20` và `passport-facebook`.
*   Luồng: Khách click "Đăng nhập Google" -> Hướng qua trang Google bấm Đồng ý -> Google văng ngược về API `/auth/google/callback` mang theo Email, Avatar -> Hệ thống tìm trong DB, nếu chưa có thì Tự động sinh ra 1 account mới.

### 7.3. Hạt nhân ứng dụng (`index.js`)
File gốc này cấu hình những bức tường thành vững chãi nhất bảo vệ Web:
1.  **Sửa lỗi treo xoay vòng của Node.js:** Ép hệ thống dùng giao thức mạng Cũ (`dns.setDefaultResultOrder('ipv4first')`) để kết nối ổn định tới API của Facebook.
2.  **Lớp áo giáp bảo mật:**
    *   `helmet()`: Ẩn thông số máy chủ.
    *   `express-rate-limit`: Giới hạn 1000 request/15 phút.
    *   `express-mongo-sanitize`: Gọt rạch toàn bộ các dấu `$`, `.` ở ô input để chống tiêm mã độc NoSQL Injection.
    *   `xss-clean`: Lọc sạch mã độc thẻ `<script>` ở ô bình luận sản phẩm.
3.  **Real-time Chat Socket.io:** Bọc gói Express App vào bên trong HTTP Server. Mở đường ống `io.on('connection')` để lắng nghe Client nhắn tin và `io.emit` phát thanh phản hồi.
4.  **Bảo vệ Session & Cookie:** Cấu hình Cookie `httpOnly: true` (Chống hacker dùng JS lấy cắp Token) và `sameSite: 'lax'` (Chống tấn công lừa đảo CSRF).

---
## TỔNG KẾT
Đây là một hệ thống Thương mại điện tử có kiến trúc cực kỳ chuyên nghiệp. Nó không dừng lại ở mức Đồ án CRUD cơ bản, mà được tối ưu hóa toàn diện về **Hiệu suất** (Caching, Stream Upload), **Bảo mật** (Anti-DDoS, NoSQL Injection, Auth Guard), và **Nghiệp vụ thực tế** (Thanh toán VNPAY, Bot AI RAG, Phân quyền ma trận). File báo cáo này đã mổ xẻ 100% logic bên dưới vỏ bọc hệ thống.
