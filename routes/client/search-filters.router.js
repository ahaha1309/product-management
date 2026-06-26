const express = require('express');
const router = express.Router();
const variantController = require('../../controller/client/product-variant.controller');
const comparisonController = require('../../controller/client/product-comparison.controller');
const advancedSearchController = require('../../controller/client/advanced-search.controller');

// ========== PRODUCT VARIANTS ==========
router.get('/variants/:productId', variantController.getProductVariants);
router.get('/variant/sku/:sku', variantController.getVariantBySku);
router.get('/variants/combinations', variantController.getVariantCombinations);
router.post('/variant/check-availability', variantController.checkAvailability);
router.get('/variants/price/:productId', variantController.getBestPriceVariant);
router.get('/variant/group', variantController.getVariantsByGroup);

// ========== PRODUCT COMPARISON ==========
router.get('/comparison', comparisonController.getComparison);
router.post('/comparison/add', comparisonController.addToComparison);
router.delete('/comparison/:productId', comparisonController.removeFromComparison);
router.delete('/comparison-clear', comparisonController.clearComparison);
router.post('/comparison/report', comparisonController.getComparisonReport);
router.get('/comparison/check/:productId', comparisonController.isInComparison);

// ========== ADVANCED SEARCH ==========
router.get('/search/advanced', advancedSearchController.advancedSearch);
router.get('/search/autocomplete', advancedSearchController.searchAutocomplete);
router.post('/search/specifications', advancedSearchController.filterBySpecifications);
router.get('/search/attributes', advancedSearchController.searchByAttributes);
router.get('/search/trending', advancedSearchController.getTrendingSearches);
router.get('/search/seller', advancedSearchController.searchBySeller);

module.exports = router;
