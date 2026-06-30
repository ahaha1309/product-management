require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URL = process.env.MONGO_URL;

async function run() {
  await mongoose.connect(MONGO_URL);
  console.log('✅ Kết nối MongoDB thành công');

  // Đếm trước khi xóa
  const count = await mongoose.connection.db
    .collection('products')
    .countDocuments({ position: { $gte: 1, $lte: 45 } });

  console.log(`🔍 Tìm thấy ${count} sản phẩm có vị trí từ 1 đến 45`);

  if (count === 0) {
    console.log('⚠️  Không có sản phẩm nào để xóa.');
    await mongoose.disconnect();
    return;
  }

  const result = await mongoose.connection.db
    .collection('products')
    .deleteMany({ position: { $gte: 1, $lte: 45 } });

  console.log(`🗑️  Đã xóa ${result.deletedCount} sản phẩm thành công.`);
  await mongoose.disconnect();
  console.log('🔌 Đã đóng kết nối.');
}

run().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
