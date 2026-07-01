const cartModel = require('../../models/cart.model');
const productModel = require('../../models/product.model');
const productHelper = require('../../helper/product');
const flashSaleHelper = require('../../helper/flash-sale');
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
    const productRawList = [];
    for (let item of cart.products) {
      const product = await productModel.findOne({ _id: item.productId });
      if (product) {
        productRawList.push(product);
        validProducts.push(item);
      }
    }

    const processedProducts = await flashSaleHelper.applyFlashSaleToProducts(productRawList);
    
    for (let i = 0; i < validProducts.length; i++) {
        validProducts[i].product = processedProducts[i];
    }
    
    if (validProducts.length !== originalLength) {
      const productsToSave = validProducts.map(p => ({
         productId: p.productId,
         quantity: p.quantity,
         variantText: p.variantText,
         variantId: p.variantId
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
  let variantId = null;

  try {
    if (variantText) {
      const ProductVariant = require('../../models/product-variant.model');
      const variants = await ProductVariant.find({ productId: idAdd, isActive: true });
      const textParts = variantText.split(', ').map(s => s.trim());
      
      for (const v of variants) {
        if (v.attributes) {
          const attrValues = Object.values(v.attributes).filter(Boolean).map(s => s.trim());
          const isMatch = textParts.every(part => attrValues.includes(part)) && textParts.length === attrValues.length;
          if (isMatch) {
            variantId = v._id.toString();
            break;
          }
        }
      }
    }

    const cart = await cartModel.findOne({ userId: res.locals.user._id });
    if (cart) {
      const productExist = cart.products.find((item) => 
        item.productId == idAdd && 
        (variantId ? item.variantId == variantId : (item.variantText || '') === variantText)
      );
      
      if (productExist) {
        const newQuantity = productExist.quantity + quantity;
        await cartModel.updateOne(
          { userId: res.locals.user._id, 'products._id': productExist._id },
          { $set: { 'products.$.quantity': newQuantity } }
        );
      } else {
        await cartModel.updateOne(
          { userId: res.locals.user._id },
          { $push: { products: { productId: idAdd, quantity: quantity, variantText: variantText, variantId: variantId } } }
        );
      }
    } else {
      await cartModel.create({
        userId: res.locals.user._id,
        products: [{ productId: idAdd, quantity: quantity, variantText: variantText, variantId: variantId }],
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
  const id = req.params.id; // Item ID (_id in the products array)
  try {
    await cartModel.updateOne(
      { userId: res.locals.user._id },
      { $pull: { products: { _id: id } } }
    );
    req.flash('success', 'Đã xóa sản phẩm thành công');
    res.redirect('back');
  } catch(e) {
    res.redirect('back');
  }
};
module.exports.updateQuantity = async (req, res) => {
  const idUpdate = req.params.id; // Item ID
  const quantity = req.params.quantity;
  try {
    await cartModel.updateOne(
      { userId: res.locals.user._id, 'products._id': idUpdate },
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
