/**
 * Product Variants Controller
 * Handle variant selection, stock, pricing
 */

const ProductVariant = require('../../models/product-variant.model');
const Product = require('../../models/product.model');

// Get all variants for a product
exports.getProductVariants = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const variants = await ProductVariant.find({
      productId: productId,
      isActive: true
    });
    
    // Group by attributes
    const grouped = {
      sizes: [],
      colors: [],
      materials: [],
      storage: [],
      processor: []
    };
    
    variants.forEach(v => {
      if (v.attributes.size && !grouped.sizes.includes(v.attributes.size)) {
        grouped.sizes.push(v.attributes.size);
      }
      if (v.attributes.color && !grouped.colors.includes(v.attributes.color)) {
        grouped.colors.push(v.attributes.color);
      }
      if (v.attributes.material && !grouped.materials.includes(v.attributes.material)) {
        grouped.materials.push(v.attributes.material);
      }
      if (v.attributes.storage) {
        grouped.storage.push({
          value: v.attributes.storage,
          sku: v.sku
        });
      }
      if (v.attributes.processor) {
        grouped.processor.push({
          value: v.attributes.processor,
          sku: v.sku
        });
      }
    });
    
    return res.json({
      code: '00',
      message: 'Success',
      data: {
        variants,
        grouped,
        count: variants.length
      }
    });
    
  } catch (error) {
    return res.status(500).json({
      code: '99',
      message: error.message
    });
  }
};

// Get specific variant by SKU
exports.getVariantBySku = async (req, res) => {
  try {
    const { sku } = req.params;
    
    const variant = await ProductVariant.findOne({
      sku: sku.toUpperCase(),
      isActive: true
    }).populate('productId');
    
    if (!variant) {
      return res.status(404).json({
        code: '404',
        message: 'Variant not found'
      });
    }
    
    return res.json({
      code: '00',
      message: 'Success',
      data: variant
    });
    
  } catch (error) {
    return res.status(500).json({
      code: '99',
      message: error.message
    });
  }
};

// Get variant combinations (for filtering)
exports.getVariantCombinations = async (req, res) => {
  try {
    const { productId, size, color, material } = req.query;
    
    const query = {
      productId: productId,
      isActive: true,
      'stock.available': { $gt: 0 }
    };
    
    if (size) query['attributes.size'] = size;
    if (color) query['attributes.color'] = color;
    if (material) query['attributes.material'] = material;
    
    const variants = await ProductVariant.find(query);
    
    return res.json({
      code: '00',
      message: 'Success',
      data: variants
    });
    
  } catch (error) {
    return res.status(500).json({
      code: '99',
      message: error.message
    });
  }
};

// Check variant availability
exports.checkAvailability = async (req, res) => {
  try {
    const { sku, quantity } = req.body;
    
    const variant = await ProductVariant.findOne({ sku });
    
    if (!variant) {
      return res.json({
        code: '01',
        message: 'Variant not found',
        available: false
      });
    }
    
    const isAvailable = variant.stock.available >= quantity;
    
    return res.json({
      code: '00',
      message: 'Success',
      data: {
        sku: sku,
        available: isAvailable,
        requestedQty: quantity,
        availableQty: variant.stock.available,
        pricing: variant.pricing
      }
    });
    
  } catch (error) {
    return res.status(500).json({
      code: '99',
      message: error.message
    });
  }
};

// Get best price variant
exports.getBestPriceVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const bestPrice = await ProductVariant.findOne({
      productId: productId,
      isActive: true,
      'stock.available': { $gt: 0 }
    }).sort({ 'pricing.finalPrice': 1 });
    
    const highestPrice = await ProductVariant.findOne({
      productId: productId,
      isActive: true,
      'stock.available': { $gt: 0 }
    }).sort({ 'pricing.finalPrice': -1 });
    
    return res.json({
      code: '00',
      message: 'Success',
      data: {
        bestPrice: bestPrice?.pricing.finalPrice,
        highestPrice: highestPrice?.pricing.finalPrice,
        priceRange: {
          min: bestPrice?.pricing.finalPrice,
          max: highestPrice?.pricing.finalPrice
        }
      }
    });
    
  } catch (error) {
    return res.status(500).json({
      code: '99',
      message: error.message
    });
  }
};

// Get variants by size/color group
exports.getVariantsByGroup = async (req, res) => {
  try {
    const { productId, groupBy } = req.query; // groupBy: 'size', 'color', 'storage'
    
    const pipeline = [
      {
        $match: {
          productId: mongoose.Types.ObjectId(productId),
          isActive: true
        }
      },
      {
        $group: {
          _id: `$attributes.${groupBy}`,
          variants: { $push: '$$ROOT' },
          count: { $sum: 1 },
          minPrice: { $min: '$pricing.finalPrice' },
          maxPrice: { $max: '$pricing.finalPrice' }
        }
      }
    ];
    
    const grouped = await ProductVariant.aggregate(pipeline);
    
    return res.json({
      code: '00',
      message: 'Success',
      data: grouped
    });
    
  } catch (error) {
    return res.status(500).json({
      code: '99',
      message: error.message
    });
  }
};
