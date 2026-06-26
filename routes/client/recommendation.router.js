const express = require('express');
const router = express.Router();
const recommendationController = require('../../controller/client/recommendation.controller');

// Recommendations based on browsing
router.get('/personalized', recommendationController.personalizedRecommendations);

// Related products
router.get('/related/:productId', recommendationController.relatedProducts);

// Customers also bought
router.get('/also-bought/:productId', recommendationController.customersAlsoBought);

// Trending products
router.get('/trending', recommendationController.trendingProducts);

// Best rated products
router.get('/best-rated', recommendationController.bestRated);

// Track product view
router.post('/track-view', recommendationController.trackView);

// Recently viewed
router.get('/recently-viewed', recommendationController.recentlyViewed);

module.exports = router;
