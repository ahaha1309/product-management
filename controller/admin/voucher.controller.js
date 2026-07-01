const Voucher = require('../../models/voucher.model');
const systemConfig = require('../../config/system');

// [GET] /admin/vouchers - Danh sách voucher
module.exports.index = async (req, res) => {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 });

    const stats = {
      total: vouchers.length,
      active: vouchers.filter(v => v.status === 'active').length,
      expired: vouchers.filter(v => v.status === 'expired' || new Date(v.validTo) < new Date()).length,
      totalUsed: vouchers.reduce((sum, v) => sum + (v.usedCount || 0), 0),
    };

    res.render('admin/pages/vouchers/index', {
      title: 'Quản lý Voucher',
      vouchers,
      stats,
    });
  } catch (error) {
    console.log(error);
    res.redirect('back');
  }
};

// [GET] /admin/vouchers/create
module.exports.createGet = async (req, res) => {
  res.render('admin/pages/vouchers/create', {
    title: 'Tạo Voucher mới',
  });
};

// [POST] /admin/vouchers/create
module.exports.createPost = async (req, res) => {
  try {
    const { code, title, type, discountPercentage, maxDiscountAmount, minOrderValue, validFrom, validTo, usageLimit, status } = req.body;

    const existingVoucher = await Voucher.findOne({ code: code.toUpperCase() });
    if (existingVoucher) {
      req.flash('error', 'Mã voucher đã tồn tại!');
      return res.redirect('back');
    }

    const newVoucher = new Voucher({
      code: code.toUpperCase(),
      title: title || '',
      type: type || 'percentage',
      discountPercentage: parseInt(discountPercentage) || 0,
      maxDiscountAmount: parseInt(maxDiscountAmount) || 0,
      minOrderValue: parseInt(minOrderValue) || 0,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validTo: validTo ? new Date(validTo) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageLimit: parseInt(usageLimit) || 1,
      status: status || 'active',
    });

    await newVoucher.save();
    req.flash('success', 'Tạo voucher thành công!');
    res.redirect(`${systemConfig.prefixAdmin}/vouchers`);
  } catch (error) {
    console.log(error);
    req.flash('error', 'Có lỗi xảy ra!');
    res.redirect('back');
  }
};

// [GET] /admin/vouchers/edit/:id
module.exports.editGet = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      req.flash('error', 'Voucher không tồn tại!');
      return res.redirect('back');
    }
    res.render('admin/pages/vouchers/edit', {
      title: 'Chỉnh sửa Voucher',
      voucher,
    });
  } catch (error) {
    console.log(error);
    res.redirect('back');
  }
};

// [PATCH] /admin/vouchers/edit/:id
module.exports.editPatch = async (req, res) => {
  try {
    const { code, title, type, discountPercentage, maxDiscountAmount, minOrderValue, validFrom, validTo, usageLimit, status } = req.body;

    await Voucher.updateOne({ _id: req.params.id }, {
      code: code.toUpperCase(),
      title: title || '',
      type: type || 'percentage',
      discountPercentage: parseInt(discountPercentage) || 0,
      maxDiscountAmount: parseInt(maxDiscountAmount) || 0,
      minOrderValue: parseInt(minOrderValue) || 0,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validTo: validTo ? new Date(validTo) : undefined,
      usageLimit: parseInt(usageLimit) || 1,
      status: status || 'active',
    });

    req.flash('success', 'Cập nhật voucher thành công!');
    res.redirect(`${systemConfig.prefixAdmin}/vouchers`);
  } catch (error) {
    console.log(error);
    req.flash('error', 'Có lỗi xảy ra!');
    res.redirect('back');
  }
};

// [DELETE] /admin/vouchers/delete/:id
module.exports.delete = async (req, res) => {
  try {
    await Voucher.deleteOne({ _id: req.params.id });
    res.status(200).json({ code: 200, message: 'Xóa voucher thành công!' });
  } catch (error) {
    res.status(500).json({ code: 500, message: 'Có lỗi xảy ra!' });
  }
};
