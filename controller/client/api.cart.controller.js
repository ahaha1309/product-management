const cartModel = require('../../models/cart.model');
const ProductVariant = require('../../models/product-variant.model');

// Helper to calculate total cart quantity
async function getCartQuantity(userId) {
  const cart = await cartModel.findOne({ userId });
  return cart ? cart.products.length : 0;
}

module.exports.addProduct = async (req, res) => {
  const idAdd = req.params.id;
  const quantity = parseInt(req.body.quantity) || 1;
  const variantText = req.body.variantText || '';
  let variantId = null;

  try {
    if (variantText) {
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

    const userId = res.locals.user._id;
    const cart = await cartModel.findOne({ userId });
    
    if (cart) {
      const productExist = cart.products.find((item) => 
        item.productId == idAdd && 
        (variantId ? item.variantId == variantId : (item.variantText || '') === variantText)
      );
      
      if (productExist) {
        const newQuantity = productExist.quantity + quantity;
        await cartModel.updateOne(
          { userId, 'products._id': productExist._id },
          { $set: { 'products.$.quantity': newQuantity } }
        );
      } else {
        await cartModel.updateOne(
          { userId },
          { $push: { products: { productId: idAdd, quantity, variantText, variantId } } }
        );
      }
    } else {
      await cartModel.create({
        userId,
        products: [{ productId: idAdd, quantity, variantText, variantId }],
      });
    }

    const newCartQty = await getCartQuantity(userId);

    res.json({
      code: '00',
      message: 'Thêm sản phẩm vào giỏ hàng thành công',
      data: { cartQuantity: newCartQty }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: '99', message: 'Lỗi hệ thống' });
  }
};

module.exports.deleteProduct = async (req, res) => {
  const id = req.params.id; // Item ID
  const userId = res.locals.user._id;
  try {
    await cartModel.updateOne(
      { userId },
      { $pull: { products: { _id: id } } }
    );
    const newCartQty = await getCartQuantity(userId);
    res.json({
      code: '00',
      message: 'Đã xóa sản phẩm khỏi giỏ hàng',
      data: { cartQuantity: newCartQty }
    });
  } catch(e) {
    console.error(e);
    res.status(500).json({ code: '99', message: 'Lỗi hệ thống' });
  }
};

module.exports.updateQuantity = async (req, res) => {
  const idUpdate = req.params.id; // Item ID
  const quantity = parseInt(req.params.quantity);
  const userId = res.locals.user._id;

  if (isNaN(quantity) || quantity < 1) {
    return res.status(400).json({ code: '01', message: 'Số lượng không hợp lệ' });
  }

  try {
    await cartModel.updateOne(
      { userId, 'products._id': idUpdate },
      { $set: { 'products.$.quantity': quantity } }
    );
    res.json({
      code: '00',
      message: 'Cập nhật số lượng thành công',
      data: { quantity }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: '99', message: 'Lỗi hệ thống' });
  }
};
