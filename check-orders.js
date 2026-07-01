require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/orders.model');

mongoose.connect(process.env.MONGO_URL).then(async () => {
  const orders = await Order.find({ status: 'finish' });
  console.log('Finished orders:');
  orders.forEach(o => console.log('ID:', o._id, 'CreatedAt:', o.createdAt, 'Amount:', o.amount));
  mongoose.disconnect();
});
