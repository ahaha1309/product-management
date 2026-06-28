const analyticsHelper = require('../../helper/analytics');
const socialProofHelper = require('../../helper/social-proof');

// [GET] Dashboard analytics
module.exports.index = async (req, res) => {
  try {
    const overview = await analyticsHelper.getDashboardOverview(30);
    const revenueTrend = await analyticsHelper.getRevenueTrend(30);
    const topCategories = await analyticsHelper.getTopCategories(5);
    const customerMetrics = await analyticsHelper.getCustomerMetrics();
    const reviewAnalytics = await analyticsHelper.getReviewAnalytics(30);
    const productPerformance = await analyticsHelper.getProductPerformance(10);

    // Social proof
    const liveOrders = await socialProofHelper.getLiveOrders(5);
    const topSellingProducts = await socialProofHelper.getTopSellingProducts(3, 30);
    const latestReviews = await socialProofHelper.getLatestReviews(5);
    const generalStats = await socialProofHelper.getGeneralStats();

    res.render('admin/pages/analytics/dashboard', {
      title: 'Phân tích & Thống kê',
      overview,
      revenueTrend,
      topCategories,
      customerMetrics,
      reviewAnalytics,
      productPerformance,
      liveOrders,
      topSellingProducts,
      latestReviews,
      generalStats
    });

  } catch (error) {
    console.log(error);
    res.redirect('back');
  }
};

// [GET] Revenue report
module.exports.revenueReport = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const revenueTrend = await analyticsHelper.getRevenueTrend(days);
    const overview = await analyticsHelper.getDashboardOverview(days);

    res.render('admin/pages/analytics/revenue', {
      title: 'Báo cáo doanh thu',
      revenueTrend,
      overview,
      period: days
    });

  } catch (error) {
    res.redirect('back');
  }
};

// [GET] Customer analytics
module.exports.customerAnalytics = async (req, res) => {
  try {
    const customerMetrics = await analyticsHelper.getCustomerMetrics();
    const conversionFunnel = await analyticsHelper.getConversionFunnel();

    res.render('admin/pages/analytics/customers', {
      title: 'Phân tích khách hàng',
      customerMetrics,
      conversionFunnel
    });

  } catch (error) {
    res.redirect('back');
  }
};

// [GET] Product analytics
module.exports.productAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const productPerformance = await analyticsHelper.getProductPerformance(20, days);
    const topCategories = await analyticsHelper.getTopCategories(10, days);

    res.render('admin/pages/analytics/products', {
      title: 'Phân tích sản phẩm',
      productPerformance,
      topCategories,
      period: days
    });

  } catch (error) {
    res.redirect('back');
  }
};

// [GET] Review analytics
module.exports.reviewAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const reviewAnalytics = await analyticsHelper.getReviewAnalytics(days);

    res.render('admin/pages/analytics/reviews', {
      title: 'Phân tích đánh giá',
      reviewAnalytics,
      period: days
    });

  } catch (error) {
    res.redirect('back');
  }
};

// [GET] Export analytics (CSV/Excel)
module.exports.exportAnalytics = async (req, res) => {
  try {
    const type = req.query.type || 'revenue'; // revenue, customer, product
    const days = parseInt(req.query.days) || 30;

    let data = {};
    let filename = '';

    if (type === 'revenue') {
      data = await analyticsHelper.getRevenueTrend(days);
      filename = 'revenue-report.csv';
    } else if (type === 'customer') {
      data = await analyticsHelper.getCustomerMetrics();
      filename = 'customer-analytics.csv';
    } else if (type === 'product') {
      data = await analyticsHelper.getProductPerformance(100, days);
      filename = 'product-analytics.csv';
    }

    // Convert to CSV
    const csv = convertToCSV(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

  } catch (error) {
    res.status(500).json({
      code: '99',
      message: 'Lỗi export'
    });
  }
};

// ==================== HELPERS ====================

function convertToCSV(data) {
  if (Array.isArray(data)) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const cell = row[header];
          return typeof cell === 'string' && cell.includes(',')
            ? `"${cell}"`
            : cell;
        }).join(',')
      )
    ];

    return csv.join('\n');
  }

  return '';
}

// [GET] API: Real-time metrics
module.exports.apiMetrics = async (req, res) => {
  try {
    const metrics = {
      liveOrders: await socialProofHelper.getLiveOrders(5),
      topSellingProducts: await socialProofHelper.getTopSellingProducts(3, 30),
      latestReviews: await socialProofHelper.getLatestReviews(5),
      generalStats: await socialProofHelper.getGeneralStats(),
      timestamp: new Date()
    };

    res.status(200).json({
      code: '00',
      data: metrics
    });

  } catch (error) {
    res.status(500).json({
      code: '99',
      message: 'Lỗi'
    });
  }
};
