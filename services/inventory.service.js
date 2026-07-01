const productModel = require('../models/product.model');
const ProductVariant = require('../models/product-variant.model');
const FlashSale = require('../models/flash-sale.model');
const orders = require('../models/orders.model');
const flashSaleHelper = require('../helper/flash-sale');

class InventoryService {
  /**
   * Validates stock and flash sale constraints for a list of cart items.
   * Modifies the items array to enrich it with full product details for checkout.
   */
  async validateAndEnrichProducts(items, userId) {
    const processedProductsForCheckout = [];

    for (let item of items) {
      const id = item.productId || item._id;
      const product = await productModel.findOne({ _id: id });

      if (!product) {
        throw new Error(`Sản phẩm không tồn tại`);
      }

      // Check base product stock
      if (product.stock !== undefined && product.stock < (item.quantity || 1)) {
        throw new Error(`Sản phẩm "${product.title}" chỉ còn ${product.stock} sản phẩm trong kho gốc`);
      }

      // Check variant stock if variantId is provided
      if (item.variantId) {
        const variant = await ProductVariant.findOne({ _id: item.variantId });
        if (!variant) {
          throw new Error(`Biến thể sản phẩm không tồn tại`);
        }
        if (variant.stock.available < (item.quantity || 1)) {
          const variantDesc = variant.attributes ? Object.values(variant.attributes).join(' - ') : variant.sku;
          throw new Error(`Biến thể "${variantDesc}" của sản phẩm "${product.title}" chỉ còn ${variant.stock.available} sản phẩm`);
        }
      }

      // Check Flash Sale constraints
      const [processedProduct] = await flashSaleHelper.applyFlashSaleToProducts([product]);

      if (processedProduct.isFlashSale) {
        const fsInfo = processedProduct.flashSale;

        // Check overall quantityLimit
        if (fsInfo.quantityLimit !== null && (fsInfo.soldQuantity + (item.quantity || 1)) > fsInfo.quantityLimit) {
          throw new Error(`Sản phẩm "${product.title}" vượt quá giới hạn Flash Sale (chỉ còn ${fsInfo.quantityLimit - fsInfo.soldQuantity} suất).`);
        }

        // Check customerLimit
        if (fsInfo.customerLimit !== null) {
          const pastOrders = await orders.find({
            userId: userId,
            status: { $nin: ['canceled'] },
            paymentStatus: { $ne: 'failed' },
            createdAt: { $gte: fsInfo.startDate, $lte: fsInfo.endDate }
          });

          let boughtCount = 0;
          for (const o of pastOrders) {
            const boughtItem = o.products.find(p => p.productId == id);
            if (boughtItem) boughtCount += boughtItem.quantity;
          }

          if (boughtCount + (item.quantity || 1) > fsInfo.customerLimit) {
            throw new Error(`Sản phẩm "${product.title}" giới hạn mỗi khách hàng mua tối đa ${fsInfo.customerLimit} sản phẩm trong đợt Flash Sale này. Bạn đã mua ${boughtCount}.`);
          }
        }
        item.flashSaleId = fsInfo.flashSaleId;
      }

      item.newPrice = processedProduct.newPrice;
      item.thumbnail = product.thumbnail;
      item.title = product.title;
      item.productId = id;

      processedProductsForCheckout.push(item);
    }

    return processedProductsForCheckout;
  }

  /**
   * Atomically deducts stock across Base Product, Variants, and Flash Sales.
   */
  async deductStock(items) {
    for (let item of items) {
      const qty = item.quantity || 1;

      // 1. Deduct Flash Sale Quantity
      if (item.flashSaleId) {
        await FlashSale.updateOne(
          {
            _id: item.flashSaleId,
            "products.productId": item.productId,
            $or: [
              { "products.quantityLimit": null },
              { $expr: { $lte: [ { $add: ["$products.soldQuantity", qty] }, "$products.quantityLimit" ] } }
            ]
          },
          {
            $inc: { "products.$.soldQuantity": qty }
          }
        );
      }

      // 2. Deduct Base Product Stock
      await productModel.updateOne(
        { _id: item.productId },
        { $inc: { stock: -qty } }
      );

      // 3. Deduct Variant Stock (if applicable)
      if (item.variantId) {
        await ProductVariant.updateOne(
          { _id: item.variantId },
          { 
            $inc: { 
              "stock.quantity": -qty,
              "stock.available": -qty 
            } 
          }
        );
      }
    }
  }

  /**
   * Atomically restores stock when an order is canceled.
   */
  async restoreStock(items) {
    for (let item of items) {
      const qty = item.quantity || 1;

      if (item.flashSaleId) {
        await FlashSale.updateOne(
          { _id: item.flashSaleId, "products.productId": item.productId },
          { $inc: { "products.$.soldQuantity": -qty } }
        );
      }

      if (item.productId) {
        await productModel.updateOne(
          { _id: item.productId },
          { $inc: { stock: qty } }
        );
      }

      if (item.variantId) {
        await ProductVariant.updateOne(
          { _id: item.variantId },
          { 
            $inc: { 
              "stock.quantity": qty,
              "stock.available": qty 
            } 
          }
        );
      }
    }
  }
}

module.exports = new InventoryService();
