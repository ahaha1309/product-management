# BÁO CÁO ĐỒ ÁN MÔN HỌC: XÂY DỰNG WEBSITE THƯƠNG MẠI ĐIỆN TỬ (E-COMMERCE)

Tài liệu này tổng hợp toàn bộ kiến trúc, luồng chức năng, cấu trúc cơ sở dữ liệu và **đặc biệt là bộ tài liệu Q&A (Câu hỏi phản biện)** được thiết kế dựa trên tâm lý của các Giảng viên/Hội đồng bảo vệ đồ án, giúp bạn tự tin bảo vệ thành quả của mình.

---

## I. TỔNG QUAN KIẾN TRÚC & CÔNG NGHỆ

Dự án được xây dựng theo mô hình **MVC (Model - View - Controller)** - kiến trúc kinh điển và dễ mở rộng.
*   **Backend:** Node.js kết hợp framework Express.js.
*   **Frontend (View Engine):** Pug (giúp code HTML ngắn gọn, logic tái sử dụng cao qua tính năng `include` và `mixin`), kết hợp với Bootstrap 5, CSS thuần và Vanilla Javascript.
*   **Cơ sở dữ liệu:** MongoDB (NoSQL) thông qua thư viện Mongoose.
*   **Authentication & Security:** JWT (JSON Web Token), HTTP-Only Cookies, mã hóa mật khẩu, OAuth2.0 (Google & Facebook Login).
*   **AI Integration:** Tích hợp Google Gemini API để xây dựng Chatbot tư vấn bán hàng thông minh.

---

## II. PHÂN TÍCH LUỒNG CHỨC NĂNG CHI TIẾT (FLOW)

Hệ thống được chia thành 2 không gian chính: **Client (Người mua hàng)** và **Admin (Quản trị viên)**.

### 1. Luồng Người Dùng (Client)
*   **Luồng Xác thực (Authentication):**
    *   Người dùng có thể Đăng ký tài khoản (mật khẩu mã hóa), Đăng nhập bằng Email/Password, hoặc dùng **Google/Facebook Login** (OAuth2).
    *   Sau khi xác thực, một Token được tạo ra và lưu an toàn vào `Cookie` để duy trì phiên đăng nhập xuyên suốt.
    *   Hỗ trợ chức năng *Quên mật khẩu* thông qua gửi mã OTP qua Email (NodeMailer).
*   **Luồng Mua hàng (E-commerce Core):**
    1.  **Duyệt & Tìm kiếm:** Khách hàng xem danh sách sản phẩm theo danh mục lồng nhau. Tìm kiếm với từ khóa, phân trang (Pagination), sắp xếp và lọc theo tiêu chí.
    2.  **Giỏ hàng (Cart):** Giỏ hàng được lưu trữ động (dựa trên Cookie cho khách vãng lai và gộp vào DB khi user đã đăng nhập). Hỗ trợ tăng giảm số lượng.
    3.  **Thanh toán (Checkout):** Nhập thông tin giao hàng, áp dụng Voucher giảm giá, áp dụng Điểm thưởng (Loyalty Points) và tiến hành đặt hàng (Order).
*   **Các Luồng Chức năng nâng cao:**
    *   **Chatbot AI:** Khách hàng trò chuyện trực tiếp. Bot không chỉ trò chuyện xã giao mà còn *đọc được dữ liệu Database* để tư vấn đúng sản phẩm shop đang bán, báo giá và kiểm tra tồn kho.
    *   **Yêu thích (Wishlist) & So sánh:** Lưu trữ các mặt hàng quan tâm, hiển thị số lượng badge real-time trên menu.
    *   **Khách hàng thân thiết (Loyalty):** Tích lũy xu/điểm sau mỗi đơn hàng thành công, dùng để trừ tiền cho đơn tiếp theo.
    *   **Review & Đánh giá:** Cho phép khách hàng để lại sao và bình luận sau khi mua.

### 2. Luồng Quản Trị Viên (Admin)
*   **Phân quyền (Roles & Permissions):** Admin có thể tạo ra nhiều Nhóm quyền (Ví dụ: *Quản lý kho, Quản lý nội dung, Super Admin*). Mỗi nhóm được cấp các tick box quyền hạn chi tiết (Xem/Thêm/Sửa/Xóa). Middleware sẽ chặn hoặc cho phép truy cập theo từng API.
*   **Quản lý Danh mục & Sản phẩm:** Hiển thị cây danh mục. Sản phẩm hỗ trợ nhiều **Biến thể (Variants)** (ví dụ: Màu sắc, Kích cỡ).
*   **Soft Delete (Xóa mềm):** Khi xóa sản phẩm, hệ thống chuyển sản phẩm vào *Thùng rác* (Trạng thái `deleted: true`) thay vì xóa vĩnh viễn, tránh làm hỏng dữ liệu các đơn hàng cũ.
*   **Quản lý Đơn hàng:** Cập nhật trạng thái (Chờ duyệt, Đang giao, Thành công), theo dõi thống kê doanh thu.

---

## III. QUẢN LÝ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

Dự án dùng MongoDB vì tính linh hoạt phi cấu trúc. Các bảng (Collections) chính:
1.  `users` & `accounts`: Phân tách rạch ròi. `users` dùng cho Client (khách), `accounts` dùng cho người quản trị Admin.
2.  `roles`: Cấu trúc JSON lưu mảng các quyền `permissions: ['products_view', 'products_create', ...]`.
3.  `product_categories` & `products`: Quan hệ phân cấp 1-n. Danh mục có trường `parent_id` tham chiếu đến chính nó để tạo cây danh mục đệ quy. Sản phẩm chứa các field `price`, `discountPercentage`, `stock`, `status`.
4.  `product_variants`: Liên kết với `products` qua `product_id`. Lưu các tùy chọn cấu hình nhỏ hơn (màu đỏ, size M...).
5.  `carts` & `orders`: Quản lý lifecycle mua hàng. Cấu trúc lồng nhau (Nested Schema) lưu trữ danh sách mặt hàng bên trong mảng `products`.
6.  `loyalty_points`, `wishlists`, `vouchers`: Các collection bổ trợ chức năng E-commerce.

---

## IV. BỘ CÂU HỎI PHẢN BIỆN (DEFENSE Q&A)

*Tâm lý của Hội đồng chấm thi: Họ không muốn nghe bạn đọc lại code. Họ muốn biết TẠI SAO bạn lại chọn giải pháp đó, bạn có lường trước các vấn đề thực tế (như bảo mật, rác dữ liệu, hiệu năng) hay không.*

### Cụm 1: Kiến trúc & Quyết định Công nghệ
**Q1: Tại sao em lại chọn MongoDB (NoSQL) cho trang web bán hàng thay vì MySQL/SQL Server?**
> **Trả lời:** Trong E-commerce, dữ liệu sản phẩm có tính linh hoạt cao. Ví dụ, cái điện thoại thì có thuộc tính RAM/ROM, nhưng quần áo thì có Size/Màu. NoSQL giúp lưu trữ cấu trúc dạng Document (JSON) linh hoạt cho từng sản phẩm mà không bị gò bó bởi các cột cố định như SQL. Thêm vào đó, kết hợp Node.js (vốn dùng JSON) với MongoDB giúp tăng tốc độ phát triển (Development Speed).

**Q2: Em đã áp dụng mô hình MVC như thế nào? Ranh giới giữa Controller và Model trong code của em là gì?**
> **Trả lời:** Controller của em hoàn toàn chỉ đóng vai trò "Điều phối". Nó nhận Request từ Router, gọi đến Model tương ứng để truy vấn Database. Sau khi Model trả về dữ liệu thuần, Controller sẽ truyền dữ liệu đó vào Pug View để render HTML. Bằng cách này, nếu sau này em muốn chuyển giao diện từ Web sang App Mobile, em chỉ cần viết lại View (hoặc API Controller) mà không cần sửa dòng code nào ở Model.

### Cụm 2: Kỹ năng xử lý & Tối ưu Database
**Q3: Thế nào là Soft Delete (Xóa mềm)? Tại sao đồ án của em không dùng lệnh xóa thẳng khỏi Database?**
> **Trả lời:** Xóa mềm là kỹ thuật đánh dấu cờ `deleted: true` thay vì xóa vật lý record đó đi. Việc này cốt lõi để bảo vệ "Tính toàn vẹn dữ liệu". Ví dụ: Một khách hàng đã đặt mua "Giày Nike", nếu em xóa thẳng sản phẩm đó khỏi DB, thì hóa đơn lịch sử mua hàng của khách sẽ bị lỗi (không tìm ra chi tiết sản phẩm). Việc đưa vào "Thùng rác" giải quyết được vấn đề này và cho phép em khôi phục lại (Restore) nếu lỡ tay ấn nhầm.

**Q4: Hệ thống danh mục đa cấp (Danh mục cha - con) em thiết kế trong DB như thế nào? Lấy ra có bị chậm không?**
> **Trả lời:** Em sử dụng kỹ thuật `parent_id` trỏ về chính collection đó. Để tối ưu khi lấy ra, em viết đệ quy (Recursive) lúc truy vấn để build ra cấu trúc cây ở Backend, rồi chuyển cục Data đó ra ngoài Frontend. Để không bị chậm, ở quy mô lớn, em có thể lưu cấu trúc đã build này vào bộ nhớ đệm Cache (như Redis).

### Cụm 3: Bảo mật & An toàn hệ thống
**Q5: Việc quản lý Đăng nhập của em dùng cơ chế gì? Token được lưu trữ ở đâu và chống bị đánh cắp như thế nào?**
> **Trả lời:** Em sử dụng JSON Web Token (JWT). Token này được em nhét vào HTTP-Only Cookie. Điểm mạnh của việc lưu trong Cookie có gắn cờ `HttpOnly` là mã độc Javascript từ trình duyệt (Tấn công XSS) sẽ KHÔNG THỂ đọc được token này, giúp tài khoản người dùng an toàn tuyệt đối so với việc lưu ở LocalStorage.

**Q6: Hệ thống phân quyền (Roles) của em cho Admin hoạt động dựa trên logic gì? Nếu User cố tình gõ URL của Admin thì sao?**
> **Trả lời:** Em có thiết kế 1 Middleware tên là `requireAuth`. Mọi request chạy vào vùng Admin đều phải đi qua chốt chặn này. Em lấy Token ra, kiểm tra trong DB xem User này mang Role gì. Trong bảng Roles chứa 1 mảng các quyền (vd: `['products_view']`). Nếu URL yêu cầu quyền tạo sản phẩm mà mảng của User không chứa `products_create`, em sẽ trả về lỗi `403 Forbidden` và chặn ngay trước khi nó chạy tới Controller.

**Q7: Nếu có người dùng công cụ tự động gửi 1000 tin nhắn một lúc vào hệ thống Chatbot AI của em để phá hoại tài nguyên server thì sao?**
> **Trả lời:** Em đã thiết lập cơ chế **Rate Limiting** (Giới hạn tỷ lệ). Em dùng một cấu trúc `Map()` lưu trữ ID và mốc thời gian truy cập. Nếu số lượng request vượt quá 10 lần/phút, hệ thống sẽ tự động Reject và không gửi truy vấn lên API của Gemini để tiết kiệm chi phí và bảo vệ server khỏi tấn công DDOS/Spam.

### Cụm 4: Tính năng đặc biệt (Phần "Ăn điểm")
**Q8: Hãy giải thích cách Chatbot AI của em hoạt động? Nó là con vẹt ChatGPT bình thường hay nó thực sự hiểu Website của em?**
> **Trả lời:** Chatbot của em là "AI mang tri thức của cửa hàng" chứ không chém gió chung chung. Khi khách hàng đặt câu hỏi, luồng xử lý của em gồm 3 bước:
> 1. Trích xuất từ khóa (NLP cơ bản) để xem khách đang hỏi về sản phẩm gì.
> 2. Chạy hàm Search trong chính Database của cửa hàng để lấy lên danh sách sản phẩm khớp.
> 3. Em "nhồi" danh sách sản phẩm lấy được đó vào một **Prompt Context (Ngữ cảnh)** ẩn và bắt Gemini API đóng vai nhân viên bán hàng, đọc dữ liệu đó để trả lời khách hàng. Do đó, bot có khả năng báo giá chính xác, thông báo tình trạng Còn/Hết hàng cực kì thông minh.

**Q9: Em xử lý trường hợp bất đồng bộ như thế nào trong Node.js khi gọi cùng lúc nhiều API hoặc truy vấn DB lớn?**
> **Trả lời:** Em tuân thủ tuyệt đối cú pháp `async / await` kết hợp với khối `try...catch` để bắt lỗi, đảm bảo Server không bị sập (Crash) nếu Database gặp trục trặc. Với các thao tác mảng dữ liệu (ví dụ tính tổng tiền giỏ hàng từ việc join nhiều sản phẩm), em dùng `Promise.all()` thay vì vòng lặp `await` tuần tự để tăng tốc độ truy xuất song song.

---

### MẸO TRẢ LỜI CỦA CHUYÊN GIA (Bí kíp phòng thân)
*   **Thái độ:** Luôn mỉm cười nhẹ khi bị hỏi xoáy. Tuyệt đối không cãi tay đôi, nếu giảng viên chỉ ra điểm sai, hãy gật đầu nói *"Dạ vâng, góc nhìn của thầy rất thực tế, em xin ghi nhận để nâng cấp hệ thống ạ."*
*   **Nguyên tắc "Đúng nhưng Chưa đủ":** Nếu bị hỏi về 1 khuyết điểm (ví dụ: *"Hệ thống giỏ hàng của em lỡ 2 người đặt cùng lúc 1 sản phẩm cuối cùng thì sao?"* - hay còn gọi là Race Condition).
Hãy dũng cảm thừa nhận và nói: *"Dạ thưa thầy, hiện tại ở quy mô đồ án môn học, em mới chỉ kiểm tra tồn kho bằng Logic thông thường. Nhưng em đã tìm hiểu và biết rằng trong môi trường thực tế, em sẽ phải áp dụng kỹ thuật **Database Transaction** hoặc **Optimistic Locking** (Khóa lạc quan) kết hợp hàng đợi Message Queue để đảm bảo không bị quá bán ạ."* -> Câu trả lời này sẽ "Ghi điểm tuyệt đối" vì nó cho thấy bạn là người có tầm nhìn kỹ sư hệ thống giỏi.
