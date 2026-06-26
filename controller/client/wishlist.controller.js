const Wishlist = require('../../models/wishlist.model');
const Product = require('../../models/product.model');
const productHelper = require('../../helper/product');

// [GET] Danh sách wishlist
module.exports.index = async (req, res) => {
  try {
    const userId = res.locals.user._id;
    let wishlist = await Wishlist.findOne({ userId: userId });

    if (!wishlist) {
      return res.render('client/pages/wishlist/index', {
        title: 'Danh sách yêu thích',
        wishlist: { products: [] },
        products: []
      });
    }

    // Lấy chi tiết từng sản phẩm
    const products = [];
    for (let item of wishlist.products) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.newPrice = productHelper.priceNewProduct(product);
        product.notes = item.notes;
        products.push(product);
      }
    }

    res.render('client/pages/wishlist/index', {
      title: 'Danh sách yêu thích',
      wishlist: wishlist,
      products: products
    });

  } catch (error) {
    console.log(error);
    res.redirect('back');
  }
};

// [POST] Thêm vào wishlist
module.exports.add = async (req, res) => {
  try {
    const userId = res.locals.user._id;
    const { productId, notes } = req.body;

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        code: '01',
        message: 'Sản phẩm không tồn tại'
      });
    }

    let wishlist = await Wishlist.findOne({ userId: userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        userId: userId,
        products: [{ productId: productId, notes: notes || '' }]
      });
    } else {
      // Kiểm tra sản phẩm đã có trong wishlist chưa
      const exists = wishlist.products.find(item => item.productId == productId);
      if (exists) {
        return res.status(400).json({
          code: '02',
          message: 'Sản phẩm đã có trong danh sách yêu thích'
        });
      }

      wishlist.products.push({
        productId: productId,
        notes: notes || ''
      });
    }

    await wishlist.save();

    res.status(200).json({
      code: '00',
      message: 'Thêm vào danh sách yêu thích thành công',
      wishlist: wishlist
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: '99',
      message: 'Lỗi server'
    });
  }
};

// [POST] Toggle wishlist
module.exports.toggle = async (req, res) => {
  try {
    const userId = res.locals.user._id;
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ userId: userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        userId: userId,
        products: [{ productId: productId, notes: '' }]
      });
      await wishlist.save();
      return res.status(200).json({ code: '00', message: 'Đã thêm vào yêu thích' });
    }

    const existsIndex = wishlist.products.findIndex(item => item.productId == productId);
    
    if (existsIndex !== -1) {
      // Nếu đã có thì xóa
      wishlist.products.splice(existsIndex, 1);
      await wishlist.save();
      return res.status(200).json({ code: '00', message: 'Đã xóa khỏi yêu thích' });
    } else {
      // Nếu chưa có thì thêm
      wishlist.products.push({ productId: productId, notes: '' });
      await wishlist.save();
      return res.status(200).json({ code: '00', message: 'Đã thêm vào yêu thích' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ code: '99', message: 'Lỗi server' });
  }
};

// [DELETE] Xóa khỏi wishlist
module.exports.remove = async (req, res) => {
  try {
    const userId = res.locals.user._id;
    const { productId } = req.params;

    await Wishlist.updateOne(
      { userId: userId },
      { $pull: { products: { productId: productId } } }
    );

    res.status(200).json({
      code: '00',
      message: 'Xóa khỏi danh sách yêu thích'
    });

  } catch (error) {
    res.status(500).json({
      code: '99',
      message: 'Lỗi'
    });
  }
};

// [PATCH] Cập nhật ghi chú
module.exports.updateNotes = async (req, res) => {
  try {
    const userId = res.locals.user._id;
    const { productId, notes } = req.body;

    await Wishlist.updateOne(
      { userId: userId, 'products.productId': productId },
      { $set: { 'products.$.notes': notes } }
    );

    res.status(200).json({
      code: '00',
      message: 'Ghi chú đã cập nhật'
    });

  } catch (error) {
    res.status(500).json({
      code: '99',
      message: 'Lỗi'
    });
  }
};

// [GET] Check sản phẩm có trong wishlist không
module.exports.isInWishlist = async (req, res) => {
  try {
    const userId = res.locals.user._id;
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({
      userId: userId,
      'products.productId': productId
    });

    res.status(200).json({
      code: '00',
      inWishlist: !!wishlist
    });

  } catch (error) {
    res.status(500).json({
      code: '99',
      message: 'Lỗi'
    });
  }
};

// [POST] Share wishlist
module.exports.shareWishlist = async (req, res) => {
  try {
    const userId = res.locals.user._id;
    const { recipientEmail } = req.body;

    // TODO: Gửi email với link wishlist
    // Thường là share link: /wishlist/{userId}

    res.status(200).json({
      code: '00',
      message: 'Danh sách yêu thích đã được chia sẻ',
      shareLink: `/wishlist/${userId}`
    });

  } catch (error) {
    res.status(500).json({
      code: '99',
      message: 'Lỗi'
    });
  }
};
