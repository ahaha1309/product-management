require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/product.model');

mongoose.connect(process.env.MONGO_URL).then(async () => {
  const products = await Product.find({ deleted: false }).select('title brand product_category_id');
  const brands = {};
  
  products.forEach(p => {
    // try to guess brand from title if brand is not set
    let brand = p.brand;
    if (!brand) {
      if (p.title.toLowerCase().includes('iphone') || p.title.toLowerCase().includes('macbook') || p.title.toLowerCase().includes('ipad')) brand = 'Apple';
      else if (p.title.toLowerCase().includes('samsung') || p.title.toLowerCase().includes('galaxy')) brand = 'Samsung';
      else if (p.title.toLowerCase().includes('xiaomi') || p.title.toLowerCase().includes('redmi')) brand = 'Xiaomi';
      else if (p.title.toLowerCase().includes('oppo')) brand = 'OPPO';
      else if (p.title.toLowerCase().includes('vivo')) brand = 'Vivo';
      else if (p.title.toLowerCase().includes('asus') || p.title.toLowerCase().includes('rog')) brand = 'ASUS';
      else if (p.title.toLowerCase().includes('dell')) brand = 'Dell';
      else if (p.title.toLowerCase().includes('hp')) brand = 'HP';
      else if (p.title.toLowerCase().includes('lenovo') || p.title.toLowerCase().includes('thinkpad')) brand = 'Lenovo';
      else if (p.title.toLowerCase().includes('acer') || p.title.toLowerCase().includes('predator')) brand = 'Acer';
      else if (p.title.toLowerCase().includes('msi')) brand = 'MSI';
      else if (p.title.toLowerCase().includes('sony')) brand = 'Sony';
      else if (p.title.toLowerCase().includes('lg')) brand = 'LG';
      else if (p.title.toLowerCase().includes('nokia')) brand = 'Nokia';
      else if (p.title.toLowerCase().includes('realme')) brand = 'Realme';
      else if (p.title.toLowerCase().includes('huawei')) brand = 'Huawei';
      else if (p.title.toLowerCase().includes('anker')) brand = 'Anker';
      else if (p.title.toLowerCase().includes('jbl')) brand = 'JBL';
      else if (p.title.toLowerCase().includes('logitech')) brand = 'Logitech';
      else if (p.title.toLowerCase().includes('razer')) brand = 'Razer';
      else if (p.title.toLowerCase().includes('corsair')) brand = 'Corsair';
      else brand = 'Unknown';
    }
    
    if (brand !== 'Unknown') {
      if (!brands[brand]) brands[brand] = [];
      brands[brand].push(p.title);
    } else {
      if (!brands['Unknown']) brands['Unknown'] = [];
      brands['Unknown'].push(p.title);
    }
  });

  console.log('Brands summary:');
  Object.keys(brands).forEach(b => {
    console.log(`- ${b}: ${brands[b].length} products`);
  });
  
  if (brands['Unknown'] && brands['Unknown'].length > 0) {
    console.log('\nUnknown products:');
    brands['Unknown'].slice(0, 10).forEach(t => console.log('  ', t));
  }
  
  mongoose.disconnect();
});
