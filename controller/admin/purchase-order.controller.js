const PurchaseOrder = require('../../models/purchase-order.model');
const Supplier = require('../../models/supplier.model');
const Product = require('../../models/product.model');

// [GET] /admin/purchase-orders
module.exports.index = async (req, res) => {
  try {
    let find = {
      deleted: false
    };

    if (req.query.keyword) {
      find.poCode = new RegExp(req.query.keyword, 'i');
    }

    const orders = await PurchaseOrder.find(find).sort({ createdAt: -1 });
    
    // Enrich with supplier name
    for (let order of orders) {
      const supplier = await Supplier.findOne({ _id: order.supplierId });
      order.supplierName = supplier ? supplier.name : 'N/A';
    }

    res.render('admin/pages/purchase-orders/index', {
      pageTitle: 'Lịch sử Nhập Kho',
      orders: orders,
      keyword: req.query.keyword
    });
  } catch (error) {
    res.redirect('back');
  }
};

// [GET] /admin/purchase-orders/create
module.exports.createGet = async (req, res) => {
  try {
    // Get active suppliers
    const suppliers = await Supplier.find({ status: 'active', deleted: false });
    // Get all products to select
    const products = await Product.find({ deleted: false }).select('title thumbnail price');

    res.render('admin/pages/purchase-orders/create', {
      pageTitle: 'Tạo Phiếu Nhập Kho',
      suppliers: suppliers,
      products: products
    });
  } catch (error) {
    res.redirect('back');
  }
};

// [POST] /admin/purchase-orders/create
module.exports.createPost = async (req, res) => {
  try {
    // req.body.productIds, req.body.quantities, req.body.unitPrices
    const { supplierId, note, productIds, quantities, unitPrices } = req.body;
    
    let productsList = [];
    let totalAmount = 0;

    // Handle single item vs multiple items from form
    if (Array.isArray(productIds)) {
      for (let i = 0; i < productIds.length; i++) {
        const qty = parseInt(quantities[i]);
        const price = parseInt(unitPrices[i]);
        productsList.push({
          productId: productIds[i],
          quantity: qty,
          unitPrice: price
        });
        totalAmount += (qty * price);
      }
    } else if (productIds) {
      const qty = parseInt(quantities);
      const price = parseInt(unitPrices);
      productsList.push({
        productId: productIds,
        quantity: qty,
        unitPrice: price
      });
      totalAmount += (qty * price);
    }

    // Generate PO Code
    const poCode = 'PO' + Date.now().toString().slice(-6);

    const purchaseOrder = new PurchaseOrder({
      poCode: poCode,
      supplierId: supplierId,
      userId: res.locals.user._id,
      products: productsList,
      totalAmount: totalAmount,
      note: note,
      status: 'completed' // Assume direct complete for simplicity, adding stock
    });

    await purchaseOrder.save();

    // DEDUCT STOCK (actually ADD STOCK since this is PO)
    for (let item of productsList) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity } }
      );
    }

    req.flash('success', 'Nhập kho thành công!');
    res.redirect('/admin/purchase-orders');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Có lỗi xảy ra!');
    res.redirect('back');
  }
};

// [GET] /admin/purchase-orders/detail/:id
module.exports.detail = async (req, res) => {
  try {
    const id = req.params.id;
    const order = await PurchaseOrder.findOne({ _id: id, deleted: false }).lean();
    
    if (!order) {
      return res.redirect('/admin/purchase-orders');
    }

    const supplier = await Supplier.findOne({ _id: order.supplierId }).lean();
    order.supplierName = supplier ? supplier.name : 'N/A';

    // Enrich products
    for (let item of order.products) {
      const p = await Product.findOne({ _id: item.productId }).select('title thumbnail').lean();
      item.productInfo = p || { title: 'Không tìm thấy SP', thumbnail: '' };
    }

    res.render('admin/pages/purchase-orders/detail', {
      pageTitle: 'Chi tiết Phiếu Nhập',
      order: order
    });
  } catch (error) {
    res.redirect('back');
  }
};
