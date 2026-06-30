require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URL);
  const db = mongoose.connection.db;
  const col = db.collection('products');

  // Lấy tất cả sản phẩm
  const products = await col.find({ deleted: false }).project({ _id: 1, title: 1 }).toArray();
  console.log(`Tổng: ${products.length} sản phẩm`);

  // Hàm tạo mô tả dựa trên tên sản phẩm
  function generateDescription(title) {
    const t = title.toLowerCase();

    // ====== ĐIỆN THOẠI ======
    if (t.includes('iphone') && t.includes('16')) {
      return `<h2>iPhone 16 – Thế hệ mới đỉnh của Apple</h2>
<p>iPhone 16 mang đến trải nghiệm cao cấp tuyệt đỉnh với chip <strong>A18 Bionic</strong> – bộ xử lý di động mạnh mẽ nhất hiện nay. Thiết kế nhôm hàng không và kính cường lực Ceramic Shield bảo vệ tối đa.</p>
<h3>🎯 Tính năng nổi bật</h3>
<ul>
  <li>Chip A18 Bionic – hiệu năng vượt trội, tiết kiệm pin</li>
  <li>Camera 48MP chính, hỗ trợ quay 4K 120fps Dolby Vision</li>
  <li>Màn hình Super Retina XDR 6.1 inch, 460ppi</li>
  <li>Pin lên đến 22 giờ phát video liên tục</li>
  <li>Hỗ trợ Apple Intelligence – AI thế hệ tiếp theo</li>
  <li>Kết nối Wi-Fi 7, Bluetooth 5.3, USB-C 3.0</li>
</ul>
<h3>📦 Thông số kỹ thuật</h3>
<p>Màn hình: 6.1" OLED | RAM: 8GB | Bộ nhớ: 128GB/256GB/512GB | iOS 18 | Sạc nhanh 25W | Sạc không dây MagSafe 15W</p>`;
    }

    if (t.includes('iphone') && t.includes('15')) {
      return `<h2>iPhone 15 – Hiệu năng đỉnh cao, thiết kế tinh tế</h2>
<p>iPhone 15 ra mắt với màn hình Dynamic Island lần đầu xuất hiện trên dòng tiêu chuẩn, cổng USB-C và camera 48MP cải tiến vượt bậc.</p>
<h3>🎯 Tính năng nổi bật</h3>
<ul>
  <li>Chip A16 Bionic – xử lý nhanh mượt mọi tác vụ</li>
  <li>Dynamic Island – thông báo thông minh, sáng tạo</li>
  <li>Camera chính 48MP f/1.6, chụp Portrait tự động</li>
  <li>Màn hình Super Retina XDR 6.1 inch, 460ppi</li>
  <li>Cổng USB-C – sạc và truyền dữ liệu nhanh hơn</li>
  <li>Pin 3.877mAh, sạc nhanh 20W, MagSafe 15W</li>
</ul>
<p><strong>Hệ điều hành:</strong> iOS 17 | <strong>Màu sắc:</strong> Đen, Trắng, Hồng, Vàng, Xanh lam</p>`;
    }

    if (t.includes('samsung') && (t.includes('s24 ultra') || t.includes('s24ultra'))) {
      return `<h2>Samsung Galaxy S24 Ultra – Siêu phẩm AI đỉnh cao 2024</h2>
<p>Galaxy S24 Ultra tái định nghĩa điện thoại thông minh với khung titan cao cấp, bút S Pen tích hợp và nền tảng <strong>Galaxy AI</strong> mạnh mẽ nhất từ trước đến nay.</p>
<h3>🎯 Điểm nổi bật</h3>
<ul>
  <li>Chip Snapdragon 8 Gen 3 for Galaxy – mạnh nhất phân khúc Android</li>
  <li>Camera 200MP với zoom quang học 5x và 10x</li>
  <li>Màn hình Dynamic AMOLED 2X 6.8 inch, 120Hz QHD+</li>
  <li>Galaxy AI: Circle to Search, Live Translate, Note Assist</li>
  <li>Bút S Pen tích hợp – viết, vẽ trực tiếp trên màn hình</li>
  <li>Pin 5.000mAh, sạc nhanh 45W, sạc không dây 15W</li>
</ul>
<h3>📦 Thông số</h3>
<p>RAM: 12GB | Bộ nhớ: 256GB/512GB/1TB | Titan Đen/Tím/Xám/Cam | IP68 chống nước</p>`;
    }

    if (t.includes('samsung') && t.includes('a02')) {
      return `<h2>Samsung Galaxy A02 – Smartphone tầm trung giá tốt</h2>
<p>Galaxy A02 là lựa chọn lý tưởng cho người dùng phổ thông cần điện thoại bền, pin trâu và màn hình lớn với mức giá phải chăng.</p>
<h3>🎯 Tính năng nổi bật</h3>
<ul>
  <li>Màn hình PLS TFT 6.5 inch HD+ – xem video thoải mái</li>
  <li>Pin 5.000mAh siêu trâu – dùng cả ngày không lo hết pin</li>
  <li>Camera kép 13MP + 2MP – chụp ảnh sắc nét</li>
  <li>RAM 3GB, bộ nhớ 32GB – đủ dùng cho nhu cầu cơ bản</li>
  <li>Hỗ trợ thẻ nhớ microSD lên đến 1TB</li>
  <li>Thiết kế nhỏ gọn, nhiều màu sắc trẻ trung</li>
</ul>
<p>Phù hợp cho: Học sinh, người già, người dùng smartphone lần đầu</p>`;
    }

    if (t.includes('xiaomi') && t.includes('redmi note 14')) {
      return `<h2>Xiaomi Redmi Note 14 – Hiệu năng mạnh, giá hợp lý</h2>
<p>Redmi Note 14 nổi bật với màn hình AMOLED sắc nét, camera 108MP và pin khủng 5.500mAh, xứng đáng là vua phân khúc tầm trung 2024.</p>
<h3>🎯 Tính năng nổi bật</h3>
<ul>
  <li>Màn hình AMOLED 6.67 inch 120Hz – màu sắc sống động</li>
  <li>Camera chính 108MP với OIS chống rung quang học</li>
  <li>Chip Snapdragon 685 hiệu năng mượt mà</li>
  <li>RAM 8GB (LPDDR4X) + ROM 128GB (UFS 2.2)</li>
  <li>Pin 5.500mAh, sạc nhanh 33W – đầy pin trong 65 phút</li>
  <li>IP54 – kháng nước, kháng bụi cơ bản</li>
</ul>
<p><strong>Màu sắc:</strong> Đen, Xanh dương, Xanh lá, Trắng | <strong>Kết nối:</strong> 4G LTE, Wi-Fi 6, NFC</p>`;
    }

    if (t.includes('xiaomi') && t.includes('redmi note 15')) {
      return `<h2>Xiaomi Redmi Note 15 – Nâng cấp toàn diện 2025</h2>
<p>Redmi Note 15 mang đến bước tiến lớn với màn hình AMOLED tần số quét cao, camera cải tiến và hiệu năng chip mới nhất của Mediatek.</p>
<h3>🎯 Điểm nổi bật</h3>
<ul>
  <li>Màn hình AMOLED 6.7 inch 144Hz – cuộn cực mượt</li>
  <li>Camera 200MP AI – chụp ban đêm xuất sắc</li>
  <li>Chip Helio G100 Ultra – gaming không giật lag</li>
  <li>RAM 6GB/8GB, ROM 128GB/256GB</li>
  <li>Pin 6.000mAh, sạc nhanh 45W</li>
  <li>Thiết kế kính 3D cong viền mỏng sang trọng</li>
</ul>`;
    }

    if (t.includes('xiaomi') && t.includes('redmi 15c')) {
      return `<h2>Xiaomi Redmi 15C – Pin khủng 6000mAh, màn hình lớn</h2>
<p>Redmi 15C là điện thoại entry-level xuất sắc với pin 6.000mAh siêu trâu, màn hình 6.9 inch rộng rãi và nhiều tính năng thông minh ở mức giá cực tốt.</p>
<h3>🎯 Tính năng</h3>
<ul>
  <li>Màn hình HD+ 6.9 inch – thoải mái xem phim, lướt mạng</li>
  <li>Pin 6.000mAh – dùng 2 ngày không cần sạc</li>
  <li>Camera 50MP AI + 2MP – chụp ảnh rõ nét</li>
  <li>RAM 8GB (có thể mở rộng thêm 8GB từ bộ nhớ), ROM 256GB</li>
  <li>MIUI 14 dựa trên Android 13</li>
</ul>`;
    }

    if (t.includes('poco x8 pro')) {
      return `<h2>POCO X8 Pro – Gaming Phone Mạnh Mẽ 2024</h2>
<p>POCO X8 Pro là cỗ máy gaming với màn hình AMOLED 120Hz sắc sảo, chip Dimensity 9300+ mạnh mẽ và hệ thống làm mát tiên tiến.</p>
<h3>🎯 Tính năng Gaming</h3>
<ul>
  <li>Chip MediaTek Dimensity 9300+ – top tier Android 2024</li>
  <li>Màn hình AMOLED 6.67 inch 120Hz, 3.200 nits – chơi game cực đã</li>
  <li>RAM 12GB/16GB LPDDR5X – mượt mà tất cả game nặng</li>
  <li>Camera 50MP OIS + 8MP 3x Telephoto + 2MP Macro</li>
  <li>Pin 5.000mAh, sạc siêu nhanh 90W – đầy pin 28 phút</li>
  <li>Game Turbo, AI Toolbox – tối ưu hiệu năng gaming</li>
</ul>
<p><strong>Màu:</strong> Đen, Trắng | <strong>Bộ nhớ:</strong> 256GB/512GB UFS 4.0</p>`;
    }

    if (t.includes('tecno') && t.includes('spark 40')) {
      return `<h2>TECNO SPARK 40 – Màn Hình 120Hz, Sạc Nhanh 45W Giá Siêu Tốt</h2>
<p>TECNO SPARK 40 ấn tượng với màn hình 120Hz mượt mà, loa kép và sạc nhanh 45W đầy pin chỉ trong 1 giờ – tất cả ở mức giá không tưởng.</p>
<h3>🎯 Nổi bật</h3>
<ul>
  <li>Màn hình 6.67 inch IPS 120Hz – cuộn mượt, game tốt</li>
  <li>Chip Helio G85 – hiệu năng ổn định mọi tác vụ</li>
  <li>RAM 8GB + ROM 256GB – bộ nhớ rộng rãi</li>
  <li>Camera 50MP AI + 2MP, chụp chân dung đẹp</li>
  <li>Pin 5.200mAh + sạc nhanh 45W – siêu tiện lợi</li>
  <li>Loa kép Hi-Res – âm thanh sống động</li>
  <li>NFC hỗ trợ thanh toán không chạm</li>
</ul>`;
    }

    if (t.includes('itel') && t.includes('p55')) {
      return `<h2>Itel P55+ – Pin 5000mAh, NFC, Sạc Nhanh 45W</h2>
<p>Itel P55+ mang lại trải nghiệm dùng smartphone đầy đủ với pin lớn, sạc nhanh, NFC tiện lợi và màn hình 90Hz cuộn mượt – tất cả ở tầm giá entry-level.</p>
<h3>🎯 Tính năng</h3>
<ul>
  <li>Màn hình HD+ 6.6 inch 90Hz – cuộn mượt hơn điện thoại thường</li>
  <li>Pin 5.000mAh + sạc nhanh 45W – đầy pin trong ~1 tiếng</li>
  <li>RAM 8GB + ROM 256GB – không lo hết bộ nhớ</li>
  <li>NFC – thanh toán không chạm, ghép thiết bị nhanh</li>
  <li>Camera 50MP AI – chụp ảnh sắc nét ngày lẫn đêm</li>
  <li>Bluetooth 5.0, WiFi 5 – kết nối ổn định</li>
</ul>`;
    }

    if (t.includes('sony') && t.includes('xperia')) {
      return `<h2>Sony Xperia XZ1 Compact – Nhỏ Gọn, Mạnh Mẽ, Chất Âm Đỉnh</h2>
<p>Sony Xperia XZ1 Compact là smartphone compact hiếm hoi với chip Snapdragon 835 đỉnh cao, thiết kế bền chắc chuẩn IP68 và âm thanh Hi-Res Audio.</p>
<h3>🎯 Điểm mạnh</h3>
<ul>
  <li>Chip Snapdragon 835 – flagship 2017, vẫn mạnh mẽ</li>
  <li>Màn hình 4.6 inch HDR – nhỏ gọn, cầm một tay dễ dàng</li>
  <li>Camera Motion Eye 19MP – chụp 960fps super slow-motion</li>
  <li>RAM 4GB, ROM 32GB (hỗ trợ microSD)</li>
  <li>IP68 – chống nước độ sâu 1.5m trong 30 phút</li>
  <li>Hi-Res Audio, LDAC – âm thanh không dây chất lượng cao</li>
</ul>`;
    }

    if (t.includes('redmi 13c') || t.includes('poco c65')) {
      return `<h2>Xiaomi Redmi 13C – Smartphone Giá Rẻ Cấu Hình Tốt</h2>
<p>Redmi 13C tập trung vào những thứ quan trọng nhất: pin trâu, màn hình lớn, camera chụp đẹp và hiệu năng ổn định với mức giá cực kỳ hợp lý.</p>
<h3>🎯 Lý do nên chọn</h3>
<ul>
  <li>Màn hình HD+ 6.74 inch – rộng rãi cho mọi nhu cầu</li>
  <li>Chip MediaTek Helio G85 – hiệu năng tốt trong tầm giá</li>
  <li>Camera 50MP AI + 2MP – chụp ảnh sắc nét</li>
  <li>RAM 4GB/6GB/8GB – có thể mở rộng RAM ảo</li>
  <li>Pin 5.000mAh – yên tâm dùng cả ngày</li>
  <li>Thiết kế nhôm sang trọng, nhẹ 192g</li>
</ul>`;
    }

    if (t.includes('xc26 ultra') || (t.includes('xc26') && t.includes('7.3'))) {
      return `<h2>XC26 Ultra – Màn Hình Khổng Lồ 7.3 Inch, Pin 8000mAh</h2>
<p>XC26 Ultra chinh phục người dùng bằng màn hình siêu lớn 7.3 inch như máy tính bảng mini, pin 8.000mAh cực trâu và bộ nhớ 512GB rộng rãi – hoàn hảo để xem phim và giải trí.</p>
<h3>🎯 Dành cho ai?</h3>
<ul>
  <li>Người thích màn hình lớn xem phim, YouTube, TikTok</li>
  <li>Màn hình IPS 7.3 inch Full HD – sắc nét, góc nhìn rộng</li>
  <li>Pin 8.000mAh – dùng 2-3 ngày thoải mái</li>
  <li>RAM 12GB + ROM 512GB – mượt mà, không lo đầy bộ nhớ</li>
  <li>Camera 48MP + 8MP – chụp ảnh sắc nét ngày lẫn đêm</li>
  <li>Dual SIM 4G – nhận cả 2 số điện thoại cùng lúc</li>
</ul>`;
    }

    if (t.includes('a17') && t.includes('mini')) {
      return `<h2>A17 Mini – Điện Thoại Mini 4 Inch Cho Người Già & Học Sinh</h2>
<p>A17 Mini là chiếc điện thoại nhỏ gọn, nhẹ nhàng với màn hình 4 inch phù hợp cho người già, học sinh hoặc ai cần điện thoại phụ gọn nhẹ.</p>
<h3>🎯 Phù hợp cho</h3>
<ul>
  <li>Người già – cần điện thoại đơn giản, dễ dùng</li>
  <li>Học sinh – điện thoại phụ nhỏ gọn mang theo</li>
  <li>Màn hình 4 inch cảm ứng nhạy – dễ thao tác</li>
  <li>Dual SIM – dùng được 2 số điện thoại</li>
  <li>Android 9 – giao diện quen thuộc, dễ học</li>
  <li>RAM 4GB + ROM 64GB – đủ dùng cho tác vụ cơ bản</li>
</ul>
<p>Tặng kèm: Ốp lưng bảo vệ máy</p>`;
    }

    if (t.includes('s24 ultra') || (t.includes('s24') && t.includes('ultra'))) {
      return `<h2>Samsung Galaxy S24 Ultra – Đỉnh Cao Flagship Android</h2>
<p>S24 Ultra là chiếc smartphone mạnh nhất của Samsung với khung titan, camera 200MP, bút S Pen và nền tảng AI tiên tiến nhất.</p>
<h3>🎯 Nổi bật</h3>
<ul>
  <li>Chip Snapdragon 8 Gen 3 – nhanh nhất Android 2024</li>
  <li>Camera 200MP + zoom 10x quang học – chụp từ xa rõ nét</li>
  <li>Màn hình Dynamic AMOLED 2X 6.8" 120Hz QHD+</li>
  <li>S Pen tích hợp – ghi chú, vẽ, tùy chỉnh thao tác</li>
  <li>Galaxy AI: Tóm tắt, dịch thuật, chỉnh ảnh thông minh</li>
  <li>Pin 5.000mAh + sạc 45W, IP68 chống nước</li>
</ul>`;
    }

    // ====== LAPTOP ======
    if (t.includes('laptop') && t.includes('dell') && t.includes('7270')) {
      return `<h2>Laptop Dell Latitude 7270 – Mỏng Nhẹ, Bền Bỉ Cho Doanh Nhân</h2>
<p>Dell Latitude 7270 là laptop doanh nghiệp cao cấp với thiết kế nhôm siêu mỏng nhẹ, hiệu năng ổn định và độ bền tiêu chuẩn quân sự MIL-STD-810G.</p>
<h3>🎯 Thông số kỹ thuật</h3>
<ul>
  <li>CPU: Intel Core i5-6200U (2.3GHz Turbo 2.8GHz)</li>
  <li>RAM: 8GB DDR4 1866MHz – đa nhiệm mượt mà</li>
  <li>SSD: 256GB – khởi động trong 10 giây</li>
  <li>Màn hình: 12.5 inch Full HD IPS Anti-Glare</li>
  <li>Pin: 6 cell – dùng đến 10 tiếng liên tục</li>
  <li>Kết nối: USB 3.0, HDMI, USB-C, SD Card reader</li>
</ul>
<p><strong>Trọng lượng:</strong> 1.25kg – nhẹ nhất trong phân khúc | Tương thích Windows 11</p>`;
    }

    if (t.includes('laptop') && t.includes('intel core i7') && t.includes('fhd') && t.includes('15.6')) {
      return `<h2>Laptop Intel Core i7 – Màn Hình FHD 15.6 Inch, Mở Khóa Vân Tay</h2>
<p>Laptop văn phòng cao cấp với màn hình Full HD 15.6 inch sắc nét, chip Intel Core i7 thế hệ mới, RAM 16GB và SSD 1TB – hiệu năng tuyệt vời cho công việc và giải trí.</p>
<h3>🎯 Thông số</h3>
<ul>
  <li>CPU: Intel Core i7 – xử lý mượt mà đa nhiệm</li>
  <li>RAM: 16GB DDR4 – mở nhiều ứng dụng không giật</li>
  <li>SSD: 1TB NVMe – khởi động siêu nhanh, không gian lưu trữ rộng</li>
  <li>Màn hình: 15.6 inch FHD IPS 1920x1080 – sắc nét cho văn phòng</li>
  <li>Mở khóa vân tay – bảo mật tiện lợi</li>
  <li>Windows 11 bản quyền tích hợp sẵn</li>
</ul>
<p>Phù hợp cho: Sinh viên, nhân viên văn phòng, lập trình viên</p>`;
    }

    if (t.includes('laptop') && t.includes('intel core i7') && t.includes('16gb') && t.includes('512gb')) {
      return `<h2>Laptop Intel Core i7 – Siêu Mỏng 15.6 Inch, SSD 512GB</h2>
<p>Thiết kế siêu mỏng chỉ 16.5mm với hiệu năng chip Intel Core i7 thế hệ mới, cấu hình RAM 16GB và SSD 512GB – hoàn hảo cho người dùng di động cần máy tính mạnh mẽ.</p>
<h3>🎯 Điểm mạnh</h3>
<ul>
  <li>Thiết kế siêu mỏng nhẹ – dễ dàng mang theo</li>
  <li>Intel Core i7 – gaming nhẹ và đồ họa cơ bản OK</li>
  <li>RAM 16GB + SSD 512GB – không lo chậm hay đầy bộ nhớ</li>
  <li>Màn hình IPS 15.6 inch Full HD – màu sắc chuẩn</li>
  <li>Windows 11 Home – hệ điều hành hiện đại nhất</li>
  <li>Bàn phím có đèn nền – gõ ban đêm thoải mái</li>
</ul>`;
    }

    if (t.includes('laptop') && t.includes('14 inch') && t.includes('i5') && t.includes('gaming')) {
      return `<h2>Laptop Gaming 14 Inch Intel Core i5 – Gọn Nhẹ Mà Mạnh</h2>
<p>Laptop gaming 14 inch nhỏ gọn với cổng Type-C hiện đại và bàn phím số – lựa chọn hoàn hảo cho sinh viên CNTT, lập trình viên và game thủ cần laptop di động.</p>
<h3>🎯 Thông số</h3>
<ul>
  <li>CPU: Intel Core i5-8265U (1.6GHz Turbo 3.9GHz)</li>
  <li>RAM: 8GB DDR4 – xử lý đa nhiệm ổn định</li>
  <li>SSD: 128GB NVMe + HDD 1TB – khởi động nhanh, lưu trữ nhiều</li>
  <li>Màn hình: 14 inch IPS Full HD 1920x1080</li>
  <li>Cổng Type-C – sạc và truyền dữ liệu thế hệ mới</li>
  <li>Bàn phím số – tiện cho dân kế toán, tài chính</li>
</ul>`;
    }

    if (t.includes('2026') && t.includes('laptop') && t.includes('i7 8500y')) {
      return `<h2>Laptop Intel Core i7 8500Y – Siêu Mỏng, Hiệu Năng Cao 2026</h2>
<p>Laptop thế hệ mới 2026 với chip Intel Core i7 8500Y tiết kiệm điện vượt trội, RAM 16GB và SSD 1TB – tối ưu cho công việc văn phòng cao cấp và sáng tạo nội dung.</p>
<h3>🎯 Nổi bật</h3>
<ul>
  <li>Intel Core i7 8500Y – hiệu năng cao, pin siêu bền</li>
  <li>RAM 16GB LPDDR3 – đa nhiệm không giật lag</li>
  <li>SSD 1TB NVMe – tốc độ đọc ghi cực nhanh</li>
  <li>Màn hình 15.6 inch Full HD IPS</li>
  <li>Thiết kế mỏng nhẹ – phong cách doanh nhân</li>
  <li>Tặng kèm: Balo laptop + chuột không dây</li>
</ul>`;
    }

    if (t.includes('giao hàng nhanh') && t.includes('ips 14') && t.includes('gaming')) {
      return `<h2>Laptop Gaming 14 Inch IPS – Màn Hình Sắc Nét, Thiết Kế Chuyên Nghiệp</h2>
<p>Laptop gaming 14 inch với màn hình IPS chống chói, chip Intel Core i5 thế hệ 8, cổng Type-C và bàn phím số – phù hợp cho cả làm việc lẫn giải trí.</p>
<h3>🎯 Chi tiết cấu hình</h3>
<ul>
  <li>Màn hình: IPS 14 inch Full HD – chống chói hiệu quả</li>
  <li>CPU: Intel Core i5-8265U Whiskey Lake</li>
  <li>RAM: 8GB DDR4 – đủ mạnh cho lập trình, đồ họa nhẹ</li>
  <li>SSD: 128GB + HDD 1TB (tùy chọn)</li>
  <li>USB Type-C + USB 3.0 + HDMI</li>
  <li>Windows 10/11 – sẵn dùng ngay khi mở hộp</li>
</ul>`;
    }

    // ====== DEFAULT ======
    return `<h2>${title}</h2>
<p>Sản phẩm chính hãng, chất lượng cao với nhiều tính năng vượt trội. Thiết kế tinh tế, hiệu năng mạnh mẽ và độ bền vượt thời gian.</p>
<h3>🎯 Tính năng nổi bật</h3>
<ul>
  <li>Chất lượng cao cấp, được kiểm định kỹ lưỡng</li>
  <li>Thiết kế hiện đại, phù hợp mọi đối tượng người dùng</li>
  <li>Hiệu năng mạnh mẽ, ổn định trong thời gian dài</li>
  <li>Bảo hành chính hãng, hỗ trợ kỹ thuật 24/7</li>
</ul>
<p>Liên hệ ngay để được tư vấn và nhận ưu đãi tốt nhất!</p>`;
  }

  let updated = 0;
  for (const p of products) {
    const newDesc = generateDescription(p.title);
    await col.updateOne({ _id: p._id }, { $set: { description: newDesc } });
    updated++;
    console.log(`✅ [${updated}/${products.length}] ${p.title.substring(0, 60)}...`);
  }

  console.log(`\n🎉 Hoàn thành! Đã cập nhật ${updated} sản phẩm.`);
  await mongoose.disconnect();
}

run().catch(console.error);
