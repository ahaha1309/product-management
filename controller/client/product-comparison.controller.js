/**
 * Product Comparison Controller
 * Allow users to compare products side-by-side
 */

const ProductComparison = require('../../models/product-comparison.model');
const Product = require('../../models/product.model');
const ProductVariant = require('../../models/product-variant.model');

// Get user's comparison list
exports.getComparison = async (req, res) => {
  try {
    let comparison;
    
    if (req.user) {
      comparison = await ProductComparison.findOne({
        userId: req.user._id
      }).populate('products.productId');
    } else {
      comparison = await ProductComparison.findOne({
        sessionId: req.session.id
      }).populate('products.productId');
    }
    
    if (!comparison || comparison.products.length === 0) {
      return res.json({
        code: '00',
        message: 'Success',
        data: {
          products: [],
          totalItems: 0
        }
      });
    }
    
    // Get detailed product info with variants
    const detailed = await Promise.all(
      comparison.products.map(async (item) => {
        const variants = await ProductVariant.find({
          productId: item.productId._id,
          isActive: true
        });
        
        return {
          product: item.productId,
          variants: variants,
          addedAt: item.addedAt
        };
      })
    );
    
    return res.json({
      code: '00',
      message: 'Success',
      data: {
        products: detailed,
        totalItems: comparison.totalItems,
        comparisonUrl: comparison.comparisonUrl
      }
    });
    
  } catch (error) {
    return res.status(500).json({
      code: '99',
      message: error.message
    });
  }
};

// Add product to comparison
exports.addToComparison = async (req, res) => {
  try {
    const { productId } = req.body;
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        code: '404',
        message: 'Product not found'
      });
    }
    
    // Max 5 products for comparison
    let comparison;
    
    if (req.user) {
      comparison = await ProductComparison.findOne({
        userId: req.user._id
      });
    } else {
      comparison = await ProductComparison.findOne({
        sessionId: req.session.id
      });
    }
    
    if (!comparison) {
      comparison = new ProductComparison({
        userId: req.user ? req.user._id : undefined,
        sessionId: !req.user ? req.session.id : undefined,
        products: [{ productId: productId }]
      });
    } else {
      // Check if already in comparison
      const exists = comparison.products.some(
        p => p.productId.toString() === productId
      );
      
      if (exists) {
        return res.json({
          code: '01',
          message: 'Product already in comparison'
        });
      }
      
      // Check limit
      if (comparison.products.length >= 5) {
        return res.status(400).json({
          code: '02',
          message: 'Maximum 5 products for comparison'
        });
      }
      
      comparison.products.push({ productId: productId });
    }
    
    await comparison.save();
    
    return res.json({
      code: '00',
      message: 'Product added to comparison',
      data: comparison
    });
    
  } catch (error) {
    return res.status(500).json({
      code: '99',
      message: error.message
    });
  }
};

// Remove product from comparison
exports.removeFromComparison = async (req, res) => {
  try {
    const { productId } = req.params;
    
    let comparison;
    
    if (req.user) {
      comparison = await ProductComparison.findOne({
        userId: req.user._id
      });
    } else {
      comparison = await ProductComparison.findOne({
        sessionId: req.session.id
      });
    }
    
    if (!comparison) {
      return res.status(404).json({
        code: '404',
        message: 'Comparison not found'
      });
    }
    
    comparison.products = comparison.products.filter(
      p => p.productId.toString() !== productId
    );
    
    await comparison.save();
    
    return res.json({
      code: '00',
      message: 'Product removed from comparison',
      data: comparison
    });
    
  } catch (error) {
    return res.status(500).json({
      code: '99',
      message: error.message
    });
  }
};

// Clear comparison
exports.clearComparison = async (req, res) => {
  try {
    if (req.user) {
      await ProductComparison.deleteOne({
        userId: req.user._id
      });
    } else {
      await ProductComparison.deleteOne({
        sessionId: req.session.id
      });
    }
    
    return res.json({
      code: '00',
      message: 'Comparison cleared'
    });
    
  } catch (error) {
    return res.status(500).json({
      code: '99',
      message: error.message
    });
  }
};

// Generate comparison report
exports.getComparisonReport = async (req, res) => {
  try {
    const { productIds } = req.body; // Array of product IDs
    
    if (!productIds || productIds.length < 2) {
      return res.status(400).json({
        code: '01',
        message: 'Provide at least 2 products'
      });
    }
    
    const products = await Product.find({
      _id: { $in: productIds }
    });
    
    // Build comparison matrix
    const specs = {};
    
    products.forEach(p => {
      // Extract all specs from all products
      if (p.specification) {
        Object.keys(p.specification).forEach(key => {
          if (!specs[key]) specs[key] = [];
          specs[key].push({
            productId: p._id,
            value: p.specification[key]
          });
        });
      }
    });
    
    return res.json({
      code: '00',
      message: 'Success',
      data: {
        products: products,
        specifications: specs,
        comparisonMatrix: buildComparisonMatrix(products, specs)
      }
    });
    
  } catch (error) {
    return res.status(500).json({
      code: '99',
      message: error.message
    });
  }
};

// Helper function to build comparison matrix
function buildComparisonMatrix(products, specs) {
  const matrix = {};
  
  products.forEach(product => {
    matrix[product._id] = {
      name: product.title,
      price: product.newPrice,
      rating: product.rating,
      reviews: product.reviewCount,
      specs: product.specification || {}
    };
  });
  
  return matrix;
}

// Check if product is in comparison
exports.isInComparison = async (req, res) => {
  try {
    const { productId } = req.params;
    
    let comparison;
    
    if (req.user) {
      comparison = await ProductComparison.findOne({
        userId: req.user._id
      });
    } else {
      comparison = await ProductComparison.findOne({
        sessionId: req.session.id
      });
    }
    
    const inComparison = comparison?.products.some(
      p => p.productId.toString() === productId
    ) || false;
    
    return res.json({
      code: '00',
      message: 'Success',
      data: {
        productId: productId,
        inComparison: inComparison,
        totalInComparison: comparison?.totalItems || 0
      }
    });
    
  } catch (error) {
    return res.status(500).json({
      code: '99',
      message: error.message
    });
  }
};
