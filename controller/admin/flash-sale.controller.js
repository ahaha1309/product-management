const FlashSale = require('../../models/flash-sale.model');
const Product = require('../../models/product.model');

// Calculate dynamic status
const getStatus = (startDate, endDate) => {
  const now = new Date();
  if (now < startDate) return 'upcoming';
  if (now > endDate) return 'expired';
  return 'running';
};

// [GET] /admin/flash-sales
module.exports.index = async (req, res) => {
  try {
    const flashSales = await FlashSale.find({ deleted: false }).sort({ createdAt: -1 });
    
    // Add dynamic status and count
    const mappedFlashSales = flashSales.map(fs => {
      const fsObj = fs.toObject();
      fsObj.status = getStatus(fs.startDate, fs.endDate);
      fsObj.productCount = fs.products.length;
      return fsObj;
    });

    res.render('admin/pages/flash-sale/index', {
      title: 'Quản lý Flash Sale',
      flashSales: mappedFlashSales
    });
  } catch (error) {
    console.error(error);
    res.redirect('back');
  }
};

// [GET] /admin/flash-sales/create
module.exports.create = async (req, res) => {
  res.render('admin/pages/flash-sale/create', {
    title: 'Tạo Flash Sale Mới'
  });
};

// [GET] /admin/flash-sales/search-products
module.exports.searchProducts = async (req, res) => {
  try {
    const keyword = req.query.keyword || '';
    const regex = new RegExp(keyword, 'i');
    
    const products = await Product.find({
      deleted: false,
      status: 'active',
      title: regex
    }).select('title thumbnail price stock').limit(20);

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// [POST] /admin/flash-sales/create
module.exports.createPost = async (req, res) => {
  try {
    const { name, startDate, endDate, products } = req.body;
    
    if (!name || !startDate || !endDate || !products) {
      req.flash('error', 'Vui lòng nhập đầy đủ thông tin');
      return res.redirect('back');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      req.flash('error', 'Ngày kết thúc phải lớn hơn ngày bắt đầu');
      return res.redirect('back');
    }

    // Parse products from form. Form sends arrays if multiple inputs with same name, or object if structured
    // Let's assume frontend sends a JSON string or array of objects via a hidden field or properly parsed by express
    let parsedProducts = [];
    if (typeof products === 'string') {
      parsedProducts = JSON.parse(products);
    } else {
      parsedProducts = products;
    }

    if (!parsedProducts || parsedProducts.length === 0) {
      req.flash('error', 'Vui lòng chọn ít nhất 1 sản phẩm');
      return res.redirect('back');
    }

    // Validate products (discount 1-90, no duplicates)
    const productIds = new Set();
    for (let p of parsedProducts) {
      if (p.discountPercent <= 0 || p.discountPercent > 90) {
        req.flash('error', 'Phần trăm giảm giá phải từ 1 đến 90');
        return res.redirect('back');
      }
      if (productIds.has(p.productId)) {
        req.flash('error', 'Không được thêm sản phẩm trùng lặp trong cùng 1 Flash Sale');
        return res.redirect('back');
      }
      productIds.add(p.productId);

      // Check stock
      const realProduct = await Product.findById(p.productId);
      if (!realProduct) {
        req.flash('error', 'Sản phẩm không tồn tại');
        return res.redirect('back');
      }
      if (p.quantityLimit && p.quantityLimit > realProduct.stock) {
        req.flash('error', `Giới hạn số lượng Flash Sale của ${realProduct.title} không được vượt quá tồn kho (${realProduct.stock})`);
        return res.redirect('back');
      }
    }

    // Check for overlapping flash sales for these products
    const overlappingFS = await FlashSale.findOne({
      deleted: false,
      $and: [
        { startDate: { $lt: end } },
        { endDate: { $gt: start } }
      ],
      'products.productId': { $in: Array.from(productIds) }
    });

    if (overlappingFS) {
      req.flash('error', 'Một số sản phẩm đã nằm trong Flash Sale khác có cùng khoảng thời gian');
      return res.redirect('back');
    }

    const newFlashSale = new FlashSale({
      name,
      startDate: start,
      endDate: end,
      products: parsedProducts
    });

    await newFlashSale.save();
    req.flash('success', 'Tạo Flash Sale thành công');
    res.redirect(`/admin/flash-sales`);

  } catch (error) {
    console.error(error);
    req.flash('error', 'Đã có lỗi xảy ra');
    res.redirect('back');
  }
};

// [GET] /admin/flash-sales/edit/:id
module.exports.edit = async (req, res) => {
  try {
    const flashSale = await FlashSale.findById(req.params.id).populate('products.productId', 'title thumbnail price stock');
    if (!flashSale || flashSale.deleted) {
      req.flash('error', 'Không tìm thấy Flash Sale');
      return res.redirect('/admin/flash-sales');
    }

    const fsObj = flashSale.toObject();
    fsObj.status = getStatus(flashSale.startDate, flashSale.endDate);
    
    // Map products to simpler format for frontend
    fsObj.products = fsObj.products.map(p => ({
      productId: p.productId._id,
      title: p.productId.title,
      thumbnail: p.productId.thumbnail,
      price: p.productId.price,
      stock: p.productId.stock,
      discountPercent: p.discountPercent,
      quantityLimit: p.quantityLimit,
      customerLimit: p.customerLimit
    }));

    res.render('admin/pages/flash-sale/edit', {
      title: 'Chỉnh sửa Flash Sale',
      flashSale: fsObj
    });
  } catch (error) {
    console.error(error);
    res.redirect('/admin/flash-sales');
  }
};

// [PATCH] /admin/flash-sales/edit/:id
module.exports.editPatch = async (req, res) => {
  try {
    const id = req.params.id;
    const flashSale = await FlashSale.findById(id);
    
    if (!flashSale || flashSale.deleted) {
      req.flash('error', 'Không tìm thấy Flash Sale');
      return res.redirect('back');
    }

    const currentStatus = getStatus(flashSale.startDate, flashSale.endDate);
    if (currentStatus !== 'upcoming') {
      req.flash('error', 'Không thể chỉnh sửa Flash Sale đang diễn ra hoặc đã kết thúc');
      return res.redirect('back');
    }

    const { name, startDate, endDate, products } = req.body;
    
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      req.flash('error', 'Ngày kết thúc phải lớn hơn ngày bắt đầu');
      return res.redirect('back');
    }

    let parsedProducts = [];
    if (typeof products === 'string') {
      parsedProducts = JSON.parse(products);
    } else {
      parsedProducts = products;
    }

    if (!parsedProducts || parsedProducts.length === 0) {
      req.flash('error', 'Vui lòng chọn ít nhất 1 sản phẩm');
      return res.redirect('back');
    }

    const productIds = new Set();
    for (let p of parsedProducts) {
      if (p.discountPercent <= 0 || p.discountPercent > 90) {
        req.flash('error', 'Phần trăm giảm giá phải từ 1 đến 90');
        return res.redirect('back');
      }
      if (productIds.has(p.productId)) {
        req.flash('error', 'Không được thêm sản phẩm trùng lặp trong cùng 1 Flash Sale');
        return res.redirect('back');
      }
      productIds.add(p.productId);

      const realProduct = await Product.findById(p.productId);
      if (p.quantityLimit && p.quantityLimit > realProduct.stock) {
        req.flash('error', `Giới hạn số lượng Flash Sale của ${realProduct.title} không được vượt quá tồn kho (${realProduct.stock})`);
        return res.redirect('back');
      }
    }

    const overlappingFS = await FlashSale.findOne({
      _id: { $ne: id },
      deleted: false,
      $and: [
        { startDate: { $lt: end } },
        { endDate: { $gt: start } }
      ],
      'products.productId': { $in: Array.from(productIds) }
    });

    if (overlappingFS) {
      req.flash('error', 'Một số sản phẩm đã nằm trong Flash Sale khác có cùng khoảng thời gian');
      return res.redirect('back');
    }

    flashSale.name = name;
    flashSale.startDate = start;
    flashSale.endDate = end;
    flashSale.products = parsedProducts;

    await flashSale.save();
    req.flash('success', 'Cập nhật Flash Sale thành công');
    res.redirect(`/admin/flash-sales`);

  } catch (error) {
    console.error(error);
    req.flash('error', 'Đã có lỗi xảy ra');
    res.redirect('back');
  }
};

// [DELETE] /admin/flash-sales/delete/:id
module.exports.deleteItem = async (req, res) => {
  try {
    const id = req.params.id;
    await FlashSale.updateOne({ _id: id }, { deleted: true, deletedAt: new Date() });
    req.flash('success', 'Xóa Flash Sale thành công');
    res.redirect('back');
  } catch (error) {
    console.error(error);
    res.redirect('back');
  }
};
