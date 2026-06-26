const cartModel = require('../../models/cart.model');
const productModel = require('../../models/product.model');
const productHelper = require('../../helper/product');
module.exports.index = async (req, res) => {
  const userId = res.locals.user._id;
  try {
    const cart = await cartModel.findOne({ userId: userId });
    if (!cart) {
      return res.render('client/pages/cart/index', {
        title: 'Giỏ hàng',
        cart: { products: [] },
      });
    }
    const originalLength = cart.products.length;
    const validProducts = [];
    for (let item of cart.products) {
      const product = await productModel.findOne({ _id: item.productId });
      if (product) {
        product.newPrice = productHelper.priceNewProduct(product);
        item.product = product;
        validProducts.push(item);
      }
    }
    
    if (validProducts.length !== originalLength) {
      const productsToSave = validProducts.map(p => ({
         productId: p.productId,
         quantity: p.quantity,
         variantText: p.variantText
      }));
      await cartModel.updateOne({ _id: cart._id }, { products: productsToSave });
    }
    
    cart.products = validProducts;
    res.locals.quantityCart = validProducts.length;

    res.render('client/pages/cart/index', {
      title: 'Giỏ hàng',
      cart: cart,
    });
  } catch (error) {
    console.error("Cart error:", error);
    res.redirect('back');
  }
};
module.exports.addProduct = async (req, res) => {
  const idAdd = req.params.id;
  const quantity = parseInt(req.body.quantity);
  const variantText = req.body.variantText || '';

  try {
    const cart = await cartModel.findOne({ userId: res.locals.user._id });
    if (cart) {
      // Tìm sản phẩm cùng id và cùng loại biến thể
      const productExist = cart.products.find((item) => item.productId == idAdd && (item.variantText || '') === variantText);
      if (productExist) {
        const newQuantity = productExist.quantity + quantity;
        await cartModel.updateOne(
          { userId: res.locals.user._id, 'products._id': productExist._id },
          { $set: { 'products.$.quantity': newQuantity } }
        );
      } else {
        await cartModel.updateOne(
          { userId: res.locals.user._id },
          { $push: { products: { productId: idAdd, quantity: quantity, variantText: variantText } } }
        );
      }
    } else {
      await cartModel.create({
        userId: res.locals.user._id,
        products: [{ productId: idAdd, quantity: quantity, variantText: variantText }],
      });
    }
    req.flash('success', 'Thêm sản phẩm vào giỏ hàng thành công');
    res.redirect('back');
  } catch (error) {
    console.log(error);
    res.redirect('back');
  }
};
module.exports.deleteProduct = async (req, res) => {
  const id = req.params.id; // đây là _id của phần tử trong mảng products (nếu truyền từ pug) hoặc productId. 
  // Sửa lại: Trong index.pug của giỏ hàng sẽ truyền product._id (của item.productId). Ta sửa sau.
  // Hiện tại sẽ pull theo productId. Nhưng nếu có variant thì sao? Nên truyền thêm variantText hoặc dùng item._id
  // Tạm thời sửa pull theo productId (xóa tất cả variant của sp đó)
  await cartModel.updateOne(
    { userId: res.locals.user._id },
    { $pull: { products: { productId: id } } }
  );
  req.flash('success', 'Đã xóa sản phẩm thành công');
  res.redirect('back');
};
module.exports.updateQuantity = async (req, res) => {
  const idUpdate = req.params.id;
  const quantity = req.params.quantity;
  try {
    await cartModel.updateOne(
      { userId: res.locals.user._id, 'products.productId': idUpdate },
      {
        $set: {
          'products.$.quantity': quantity,
        },
      }
    );
    res.redirect('back');
  } catch (error) {
    console.log(error);
    res.redirect('back');
  }
};
