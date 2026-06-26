/**
 * Advanced Search Controller
 * Comprehensive filtering, sorting, faceted search
 */

const Product = require('../../models/product.model');
const ProductCategory = require('../../models/product-category.model');
const ProductVariant = require('../../models/product-variant.model');

// Advanced search with filters
exports.advancedSearch = async (req, res) => {
  try {
    const {
      keyword,
      category,
      minPrice,
      maxPrice,
      rating,
      sortBy,
      page = 1,
      limit = 20,
      inStock = false,
      onSale = false,
      featured = false
    } = req.query;
    
    const query = { status: 'active' };
    
    // Keyword search
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { slug: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      query.newPrice = {};
      if (minPrice) query.newPrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.newPrice.$lte = parseFloat(maxPrice);
    }
    
    // Rating filter
    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }
    
    // Stock filter
    if (inStock === 'true') {
      query.quantity = { $gt: 0 };
    }
    
    // Sale filter
    if (onSale === 'true') {
      query.discountPercentage = { $gt: 0 };
    }
    
    // Featured filter
    if (featured === 'true') {
      query.isFeatured = true;
    }
    
    // Sorting
    let sortObj = {};
    switch(sortBy) {
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'price-asc':
        sortObj = { newPrice: 1 };
        break;
      case 'price-desc':
        sortObj = { newPrice: -1 };
        break;
      case 'rating':
        sortObj = { rating: -1 };
        break;
      case 'best-seller':
        sortObj = { totalSold: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const products = await Product.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .select('title slug thumbnail newPrice discountPercentage rating quantity totalSold');
    
    const total = await Product.countDocuments(query);
    
    // Get facets for filters
    const facets = await getFacets(category);
    
    return res.json({
      code: '00',
      message: 'Success',
      data: {
        products: products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        },
        facets: facets,
        appliedFilters: {
          keyword: keyword || null,
          category: category || null,
          priceRange: minPrice || maxPrice ? { min: minPrice, max: maxPrice } : null,
          rating: rating || null
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

// Get available filters/facets
async function getFacets(selectedCategory) {
  try {
    // Price ranges
    const priceRanges = [
      { label: 'Under 500K', min: 0, max: 500000 },
      { label: '500K - 1M', min: 500000, max: 1000000 },
      { label: '1M - 5M', min: 1000000, max: 5000000 },
      { label: '5M+', min: 5000000, max: 999999999 }
    ];
    
    // Ratings
    const ratings = [
      { stars: 5, count: 0 },
      { stars: 4, count: 0 },
      { stars: 3, count: 0 },
      { stars: 2, count: 0 },
      { stars: 1, count: 0 }
    ];
    
    // Categories
    const categories = await ProductCategory.find({ status: 'active' })
      .select('_id title slug')
      .lean();
    
    // Get rating counts
    for (let i = 0; i < ratings.length; i++) {
      const count = await Product.countDocuments({
        rating: { $gte: ratings[i].stars, $lt: ratings[i].stars + 1 }
      });
      ratings[i].count = count;
    }
    
    return {
      priceRanges: priceRanges,
      ratings: ratings,
      categories: categories
    };
    
  } catch (error) {
    console.error('Error getting facets:', error);
    return {};
  }
}

// Autocomplete search
exports.searchAutocomplete = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ code: '00', data: [] });
    }
    
    const results = await Product.find({
      title: { $regex: q, $options: 'i' },
      status: 'active'
    })
      .select('title slug thumbnail')
      .limit(parseInt(limit))
      .lean();
    
    return res.json({
      code: '00',
      message: 'Success',
      data: results
    });
    
  } catch (error) {
    return res.status(500).json({
      code: '99',
      message: error.message
    });
  }
};

// Filter by specifications
exports.filterBySpecifications = async (req, res) => {
  try {
    const { specs, category, page = 1, limit = 20 } = req.body;
    // specs = { material: 'cotton', color: 'red', size: 'M' }
    
    const query = { status: 'active' };
    
    if (category) {
      query.category = category;
    }
    
    // Build specification query
    Object.keys(specs).forEach(key => {
      query[`specification.${key}`] = specs[key];
    });
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .select('title slug thumbnail newPrice rating');
    
    const total = await Product.countDocuments(query);
    
    return res.json({
      code: '00',
      message: 'Success',
      data: {
        products: products,
        total: total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    return res.status(500).json({
      code: '99',
      message: error.message
    });
  }
};

// Search by color/size/material
exports.searchByAttributes = async (req, res) => {
  try {
    const { category, color, size, material, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (category) query.category = category;
    if (color) query['specification.color'] = color;
    if (size) query['specification.size'] = size;
    if (material) query['specification.material'] = material;
    
    query.status = 'active';
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(query)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Product.countDocuments(query);
    
    // Get available options
    const availableColors = await Product.distinct(
      'specification.color',
      { category: category, status: 'active' }
    );
    
    const availableSizes = await Product.distinct(
      'specification.size',
      { category: category, status: 'active' }
    );
    
    const availableMaterials = await Product.distinct(
      'specification.material',
      { category: category, status: 'active' }
    );
    
    return res.json({
      code: '00',
      message: 'Success',
      data: {
        products: products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total
        },
        availableFilters: {
          colors: availableColors.filter(c => c),
          sizes: availableSizes.filter(s => s),
          materials: availableMaterials.filter(m => m)
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

// Trending searches
exports.getTrendingSearches = async (req, res) => {
  try {
    const trending = [
      'iPhone 15',
      'Áo thun',
      'Laptop Gaming',
      'Giày thể thao',
      'Túi xách',
      'Điện thoại',
      'Quần jean'
    ];
    
    return res.json({
      code: '00',
      data: trending
    });
    
  } catch (error) {
    return res.status(500).json({
      code: '99',
      message: error.message
    });
  }
};

// Search products by brand/seller
exports.searchBySeller = async (req, res) => {
  try {
    const { seller, page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find({
      seller: seller,
      status: 'active'
    })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Product.countDocuments({
      seller: seller,
      status: 'active'
    });
    
    return res.json({
      code: '00',
      message: 'Success',
      data: {
        products: products,
        total: total,
        seller: seller,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    return res.status(500).json({
      code: '99',
      message: error.message
    });
  }
};
