const inventoryService = require('../../services/inventory.service');
const productModel = require('../../models/product.model');
const ProductVariant = require('../../models/product-variant.model');
const FlashSale = require('../../models/flash-sale.model');

jest.mock('../../models/product.model');
jest.mock('../../models/product-variant.model');
jest.mock('../../models/flash-sale.model');
jest.mock('../../models/orders.model');
jest.mock('../../helper/flash-sale');

const flashSaleHelper = require('../../helper/flash-sale');

describe('InventoryService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateAndEnrichProducts', () => {
    it('should throw an error if product does not exist', async () => {
      productModel.findOne.mockResolvedValue(null);

      await expect(
        inventoryService.validateAndEnrichProducts([{ productId: 'fake_id' }], 'user1')
      ).rejects.toThrow('Sản phẩm không tồn tại');
    });

    it('should throw an error if base stock is insufficient', async () => {
      productModel.findOne.mockResolvedValue({ title: 'Test Product', stock: 1 });

      await expect(
        inventoryService.validateAndEnrichProducts([{ productId: 'fake_id', quantity: 2 }], 'user1')
      ).rejects.toThrow('Sản phẩm "Test Product" chỉ còn 1 sản phẩm trong kho gốc');
    });

    it('should throw an error if variant stock is insufficient', async () => {
      productModel.findOne.mockResolvedValue({ title: 'Test Product', stock: 10 });
      ProductVariant.findOne.mockResolvedValue({ stock: { available: 1 }, attributes: { color: 'Red' } });

      await expect(
        inventoryService.validateAndEnrichProducts([{ productId: 'fake_id', variantId: 'var1', quantity: 2 }], 'user1')
      ).rejects.toThrow('Biến thể "Red" của sản phẩm "Test Product" chỉ còn 1 sản phẩm');
    });

    it('should pass validation if stock is sufficient', async () => {
      productModel.findOne.mockResolvedValue({ title: 'Test Product', stock: 10, thumbnail: 'img.jpg' });
      ProductVariant.findOne.mockResolvedValue({ stock: { available: 5 }, attributes: { color: 'Red' } });
      
      flashSaleHelper.applyFlashSaleToProducts.mockResolvedValue([{ 
        newPrice: 100, 
        isFlashSale: false 
      }]);

      const items = [{ productId: 'fake_id', variantId: 'var1', quantity: 2 }];
      const result = await inventoryService.validateAndEnrichProducts(items, 'user1');

      expect(result[0].newPrice).toBe(100);
      expect(result[0].title).toBe('Test Product');
    });
  });

  describe('deductStock', () => {
    it('should execute atomic updateOne for base product and variant', async () => {
      const items = [{ productId: 'fake_id', variantId: 'var1', quantity: 2 }];
      
      await inventoryService.deductStock(items);

      expect(productModel.updateOne).toHaveBeenCalledWith(
        { _id: 'fake_id' },
        { $inc: { stock: -2 } }
      );

      expect(ProductVariant.updateOne).toHaveBeenCalledWith(
        { _id: 'var1' },
        { 
          $inc: { 
            "stock.quantity": -2,
            "stock.available": -2 
          } 
        }
      );
    });
  });
});
