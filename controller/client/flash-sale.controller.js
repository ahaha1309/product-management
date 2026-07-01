const flashSaleHelper = require('../../helper/flash-sale');
const FlashSale = require('../../models/flash-sale.model');

module.exports.index = async (req, res) => {
  try {
    const products = await flashSaleHelper.getActiveFlashSaleProducts();

    // Get the nearest end date for the countdown
    let nearestEndDate = null;
    if (products.length > 0) {
      // Find the earliest end date among active products
      const endDates = products.map(p => new Date(p.flashSale.endDate).getTime());
      nearestEndDate = new Date(Math.min(...endDates));
    }

    // Fallback: If no running sales, find the next upcoming one
    let nextUpcomingDate = null;
    if (!nearestEndDate) {
      const upcoming = await FlashSale.findOne({
        deleted: false,
        startDate: { $gt: new Date() }
      }).sort({ startDate: 1 });
      if (upcoming) {
        nextUpcomingDate = upcoming.startDate;
      }
    }

    res.render('client/pages/flash-sale/index.pug', {
      title: 'Flash Sale - Săn Deal Giá Sốc',
      metaDesc: 'Chương trình Flash Sale với hàng ngàn sản phẩm giảm giá cực sốc. Nhanh tay kẻo lỡ!',
      product: products, // Pass to product to reuse existing layouts if possible, but we'll use a specific UI
      nearestEndDate: nearestEndDate,
      nextUpcomingDate: nextUpcomingDate
    });
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
};
