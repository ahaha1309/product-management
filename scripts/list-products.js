require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URL);
  const products = await mongoose.connection.db
    .collection('products')
    .find({ deleted: false })
    .project({ _id: 1, title: 1, description: 1, product_category_id: 1 })
    .sort({ position: -1 })
    .toArray();

  console.log(JSON.stringify(products, null, 2));
  await mongoose.disconnect();
}
run().catch(console.error);
