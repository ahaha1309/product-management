/**
 * MIGRATION SCRIPT: migrate-variants.js
 * Maps legacy variantText to variantId for Carts and pending Orders.
 * Immutable rule: Completed orders (status: 'finish' or 'canceled') are NOT modified.
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Mongoose models
const Cart = require('./models/cart.model');
const Order = require('./models/orders.model');
const ProductVariant = require('./models/product-variant.model');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('[+] Connected to MongoDB');
  } catch (error) {
    console.error('[-] MongoDB connection error:', error);
    process.exit(1);
  }
}

async function findVariantIdByText(productId, variantText) {
  if (!variantText) return null;
  const variants = await ProductVariant.find({ productId: productId, isActive: true });
  const textParts = variantText.split(', ').map(s => s.trim());
  
  for (const v of variants) {
    if (v.attributes) {
      const attrValues = Object.values(v.attributes).filter(Boolean).map(s => s.trim());
      const isMatch = textParts.every(part => attrValues.includes(part)) && textParts.length === attrValues.length;
      if (isMatch) {
        return v._id.toString();
      }
    }
  }
  return null;
}

async function migrateCarts() {
  console.log('\n--- Migrating Carts ---');
  const carts = await Cart.find();
  let modifiedCount = 0;

  for (const cart of carts) {
    let hasChanges = false;
    for (const item of cart.products) {
      if (item.variantText && !item.variantId) {
        const variantId = await findVariantIdByText(item.productId, item.variantText);
        if (variantId) {
          item.variantId = variantId;
          hasChanges = true;
        } else {
          console.warn(`[!] Cannot map variantText "${item.variantText}" for productId ${item.productId} in Cart ${cart._id}`);
          // Option: Auto-heal (remove item) or skip
        }
      }
    }

    if (hasChanges) {
      // Mark modified explicitly since products is a subdocument array
      cart.markModified('products');
      await cart.save();
      modifiedCount++;
      console.log(`[+] Migrated Cart ${cart._id}`);
    }
  }
  console.log(`[INFO] Carts migrated: ${modifiedCount}/${carts.length}`);
}

async function migrateOrders() {
  console.log('\n--- Migrating Pending Orders ---');
  // Only migrate non-finalized orders
  const orders = await Order.find({ status: { $nin: ['finish', 'canceled'] } });
  let modifiedCount = 0;

  for (const order of orders) {
    let hasChanges = false;
    for (const item of order.products) {
      if (item.variantText && !item.variantId) {
        const variantId = await findVariantIdByText(item.productId, item.variantText);
        if (variantId) {
          item.variantId = variantId;
          hasChanges = true;
        } else {
          console.warn(`[!] Cannot map variantText "${item.variantText}" for productId ${item.productId} in Order ${order.orderCode}`);
        }
      }
    }

    if (hasChanges) {
      order.markModified('products');
      await order.save();
      modifiedCount++;
      console.log(`[+] Migrated Order ${order.orderCode}`);
    }
  }
  console.log(`[INFO] Orders migrated: ${modifiedCount}/${orders.length}`);
}

async function main() {
  await connectDB();
  
  try {
    // 1. Snapshot / Backup logic should be handled by DBA, but here we proceed carefully
    await migrateCarts();
    await migrateOrders();
    console.log('\n[SUCCESS] Migration completed successfully.');
  } catch (err) {
    console.error('\n[ERROR] Migration failed:', err);
  } finally {
    mongoose.disconnect();
    console.log('[+] Disconnected from MongoDB');
  }
}

main();
