const express = require('express');
const router = express.Router();
const analyticsController = require('../../controller/admin/analytics.controller');
const authMiddleware = require('../../middleware/admin/auth.middleware');

// Require admin auth
router.use(authMiddleware.requireAuth);

// Dashboard
router.get('/', analyticsController.index);

// Reports
router.get('/revenue', analyticsController.revenueReport);
router.get('/customers', analyticsController.customerAnalytics);
router.get('/products', analyticsController.productAnalytics);
router.get('/reviews', analyticsController.reviewAnalytics);

// Export
router.get('/export', analyticsController.exportAnalytics);

// API for real-time metrics
router.get('/api/metrics', analyticsController.apiMetrics);

module.exports = router;
