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
    for (let item of cart.products) {
      const product = await productModel.findOne({ _id: item.productId });
      product.newPrice = productHelper.priceNewProduct(product);
      item.product = product;
    }
    res.render('client/pages/cart/index', {
      title: 'Giỏ hàng',
      cart: cart,
    });
  } catch (error) {
    res.redirect('back');
  }
};
module.exports.addProduct = async (req, res) => {
  const idAdd = req.params.id;
  const quantity = parseInt(req.body.quantity);

  try {
    const cart = await cartModel.findOne({ userId: res.locals.user._id });
    if (cart) {
      const productExist = cart.products.find(
        item => item.productId == idAdd
      );
      if (productExist) {
        const newQuantity = productExist.quantity + quantity;
        await cartModel.updateOne(
          { userId: res.locals.user._id, "products.productId": idAdd },
          { $set: { "products.$.quantity": newQuantity } }
        );
      } else {
        await cartModel.updateOne(
          { userId: res.locals.user._id },
          { $push: { products: { productId: idAdd, quantity: quantity } } }
        );
      }
    } else {
      await cartModel.create({
        userId: res.locals.user._id,
        products: [{ productId: idAdd, quantity: quantity }],
      });
    }
    req.flash("success", "Thêm sản phẩm vào giỏ hàng thành công");
    res.redirect("back");
  } catch (error) {
    console.log(error);
    res.redirect("back");
  }
};
module.exports.deleteProduct = async (req, res) => {
  const id = req.params.id;
  await cartModel.updateOne({ userId: res.locals.user._id }, { $pull: { products: { productId: id } } });
  res.redirect('back');
};
