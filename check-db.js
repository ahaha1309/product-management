require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/orders.model');

mongoose.connect(process.env.MONGO_URL).then(async () => {
  const count = await Order.countDocuments();
  console.log('Total orders in DB:', count);
  const finishedCount = await Order.countDocuments({ status: 'finish' });
  console.log('Finished orders:', finishedCount);
  mongoose.disconnect();
});
