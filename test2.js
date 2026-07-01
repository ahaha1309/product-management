const mongoose = require('mongoose');
const productModel = require('./models/product.model');
require('dotenv').config();

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

mongoose.connect(process.env.MONGO_URL).then(async () => {
  const r = new RegExp(`(^|[\\s,.:;"'()?!\\-])` + escapeRegExp('son') + `([\\s,.:;"'()?!\\-]|$)`, 'i');
  console.log('Regex:', r);
  const matched2 = await productModel.find({ title: { $regex: r } });
  console.log('Using custom bounds matches:', matched2.map(p => p.title));
  
  const rKem = new RegExp(`(^|[\\s,.:;"'()?!\\-])` + escapeRegExp('kem') + `([\\s,.:;"'()?!\\-]|$)`, 'i');
  const matchedKem = await productModel.find({ title: { $regex: rKem } });
  console.log('Using custom bounds matches (kem):', matchedKem.map(p => p.title));
  
  process.exit(0);
});
