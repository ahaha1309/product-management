const mongoose = require('mongoose');
const orderModel = require('./models/orders.model');
const database = require('./config/database');
require('dotenv').config();

async function migrateOrders() {
  try {
    console.log("==================================================");
    console.log("   ORDER SCHEMA MIGRATION SCRIPT (STRICT MODE)    ");
    console.log("==================================================\n");

    console.log(">>> [PRE-REQUISITE CHECK: BACKUP STRATEGY] <<<");
    console.log("HƯỚNG DẪN: Trước khi chạy script này trên Production, BẮT BUỘC thực hiện mongodump:");
    console.log("mongodump --uri=\"MONGO_URL\" --collection=orders --out=./backups/orders_backup");
    console.log("Đang tiếp tục sau 3 giây...\n");
    await new Promise(r => setTimeout(r, 3000));

    await database.connect();
    console.log("Kết nối Database thành công. Bắt đầu migration schema orders...");
    
    // Find orders where products array might contain unstructured data
    const orders = await orderModel.find({});
    let migratedCount = 0;

    for (const order of orders) {
      if (order.products && Array.isArray(order.products)) {
        let needsUpdate = false;
        
        // Map and clean products array
        const cleanedProducts = order.products.map(p => {
          // If productId is missing but it has an _id inside the product, try to map it
          const pid = p.productId || p._id || p.id;
          if (!pid) return null; // Invalid item

          return {
            productId: String(pid),
            quantity: Number(p.quantity) || 1,
            price: Number(p.price) || 0,
            newPrice: Number(p.newPrice) || 0,
            title: p.title ? String(p.title) : "Sản phẩm",
            thumbnail: p.thumbnail ? String(p.thumbnail) : "",
            variantText: p.variantText ? String(p.variantText) : "",
            flashSaleId: p.flashSaleId ? String(p.flashSaleId) : undefined
          };
        }).filter(p => p !== null);

        // Update if the array was modified/cleaned
        if (cleanedProducts.length !== order.products.length || 
            JSON.stringify(cleanedProducts) !== JSON.stringify(order.products)) {
          order.products = cleanedProducts;
          await order.save();
          migratedCount++;
        }
      }
    }
    
    console.log("\n>>> [POST-MIGRATION: ROLLBACK STRATEGY] <<<");
    console.log("Nếu có bất kỳ lỗi nào trên Production, thực hiện khôi phục dữ liệu bằng lệnh sau:");
    console.log("mongorestore --uri=\"MONGO_URL\" --drop --collection=orders ./backups/orders_backup/DATABASE_NAME/orders.bson\n");

    console.log(`Migration hoàn tất an toàn. (Idempotent: Đã chuẩn hóa ${migratedCount} đơn hàng cần sửa).`);
    process.exit(0);
  } catch (error) {
    console.error("LỖI NGHIÊM TRỌNG TRONG QUÁ TRÌNH MIGRATION:", error);
    process.exit(1);
  }
}

migrateOrders();
