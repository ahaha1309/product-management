module.exports.productHelper = (product) => {
    const newProduct = product.map((item) => {
    item.priceNew = ((item.price * (100 - item.discountPercentage)) / 100).toFixed(0);
    return item;
  });
  return newProduct;
};
module.exports.priceNewProduct=(product)=>{
  const newprice=((product.price * (100 - product.discountPercentage)) / 100).toFixed(0);
  return newprice;
}