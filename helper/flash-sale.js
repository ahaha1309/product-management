const FlashSale = require('../models/flash-sale.model');

module.exports.applyFlashSaleToProducts = async (products) => {
  if (!products || products.length === 0) return products;

  const now = new Date();
  // Find all currently running flash sales
  const activeFlashSales = await FlashSale.find({
    deleted: false,
    startDate: { $lte: now },
    endDate: { $gte: now }
  });

  // Build a map of productId -> flash sale info for O(1) lookup
  const flashSaleMap = {};
  for (const fs of activeFlashSales) {
    for (const p of fs.products) {
      flashSaleMap[p.productId.toString()] = {
        flashSaleId: fs._id,
        name: fs.name,
        startDate: fs.startDate,
        endDate: fs.endDate,
        discountPercent: p.discountPercent,
        quantityLimit: p.quantityLimit,
        customerLimit: p.customerLimit,
        soldQuantity: p.soldQuantity
      };
    }
  }

  // Apply to products
  return products.map(product => {
    // Handling Mongoose Document vs Plain Object
    const item = typeof product.toObject === 'function' ? product.toObject() : { ...product };
    const idStr = (item.id || item._id || '').toString();

    const fsInfo = flashSaleMap[idStr];
    
    // Check if the flash sale item is sold out (if limit exists and soldQuantity >= quantityLimit)
    const isSoldOut = fsInfo && fsInfo.quantityLimit !== null && fsInfo.soldQuantity >= fsInfo.quantityLimit;

    if (fsInfo && !isSoldOut) {
      // It's in an active flash sale and not sold out
      item.isFlashSale = true;
      item.flashSale = fsInfo;
      
      // Override discount and new price
      item.discountPercentage = fsInfo.discountPercent;
      item.priceNew = Math.floor(item.price * (100 - fsInfo.discountPercent) / 100).toString();
      item.newPrice = Number(item.priceNew);
    } else {
      // Regular price calculation
      item.isFlashSale = false;
      const discount = item.discountPercentage || 0;
      item.discountPercentage = discount;
      if (item.price) {
        item.priceNew = Math.floor(item.price * (100 - discount) / 100).toString();
        item.newPrice = Number(item.priceNew);
      } else {
        item.priceNew = "0";
        item.newPrice = 0;
      }
    }

    return item;
  });
};

module.exports.getActiveFlashSaleProducts = async (limit = null) => {
  const Product = require('../models/product.model');
  const now = new Date();
  
  const activeFlashSales = await FlashSale.find({
    deleted: false,
    startDate: { $lte: now },
    endDate: { $gte: now }
  });

  if (activeFlashSales.length === 0) return [];

  let productIds = [];
  for (const fs of activeFlashSales) {
    for (const p of fs.products) {
      // Exclude sold out items if we only want active purchasable items
      if (p.quantityLimit === null || p.soldQuantity < p.quantityLimit) {
        productIds.push(p.productId);
      }
    }
  }

  if (productIds.length === 0) return [];

  let query = Product.find({
    _id: { $in: productIds },
    status: 'active',
    deleted: false
  });

  if (limit) {
    query = query.limit(limit);
  }

  const productsRaw = await query.exec();
  
  // Reuse the existing helper to apply dynamic prices and attach fs objects
  const processedProducts = await module.exports.applyFlashSaleToProducts(productsRaw);

  // Sort by highest discount
  processedProducts.sort((a, b) => b.discountPercentage - a.discountPercentage);
  
  return processedProducts;
};
