const Voucher = require('../../models/voucher.model');

// [GET] /vouchers
module.exports.index = async (req, res) => {
  try {
    const now = new Date();
    // Lấy danh sách các voucher đang active và còn hạn (nếu có)
    const vouchers = await Voucher.find({
      status: 'active',
      $or: [
        { validTo: { $exists: false } },
        { validTo: null },
        { validTo: { $gte: now } }
      ]
    }).sort({ createdAt: -1 });

    res.render('client/pages/voucher/index', {
      title: 'Trung Tâm Khuyến Mãi',
      vouchers: vouchers
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách voucher:', error);
    res.redirect('back');
  }
};

// [POST] /vouchers/spin
module.exports.spin = async (req, res) => {
  try {
    const now = new Date();
    // Lấy ngẫu nhiên 1 voucher đang active
    let vouchers = await Voucher.find({
      status: 'active',
      $or: [
        { validTo: { $exists: false } },
        { validTo: null },
        { validTo: { $gte: now } }
      ]
    });

    if (res.locals.user) {
      const userId = res.locals.user._id.toString();
      vouchers = vouchers.filter(v => v.usedCount < v.usageLimit && !v.usedBy.includes(userId));
    }

    if (vouchers.length === 0) {
      return res.json({ success: false, message: 'Hiện tại chưa có voucher nào phù hợp.' });
    }

    // Tỉ lệ trúng: 70% trúng voucher ngẫu nhiên, 30% trượt (Chúc bạn may mắn lần sau)
    const randomChance = Math.random();
    if (randomChance > 0.7) {
      return res.json({ 
        success: true, 
        prizeType: 'empty', 
        message: 'Chúc bạn may mắn lần sau!' 
      });
    }

    // Chọn ngẫu nhiên 1 voucher
    const randomIndex = Math.floor(Math.random() * vouchers.length);
    const winningVoucher = vouchers[randomIndex];

    return res.json({
      success: true,
      prizeType: 'voucher',
      voucher: {
        code: winningVoucher.code,
        type: winningVoucher.type,
        discountPercentage: winningVoucher.discountPercentage,
        maxDiscountAmount: winningVoucher.maxDiscountAmount
      },
      message: `Chúc mừng! Bạn nhận được mã ${winningVoucher.code}`
    });

  } catch (error) {
    console.error('Lỗi quay thưởng:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};
