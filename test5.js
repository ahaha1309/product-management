const mongoose = require('mongoose');
const Voucher = require('./models/voucher.model');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL).then(async () => {
  await Voucher.updateOne({ code: 'VIP10' }, { $set: { usedBy: [] }, $inc: { usageLimit: 100 } });
  
  // also extend freeship
  await Voucher.updateOne({ code: 'FREESHIP 7.7' }, { $set: { validTo: new Date('2027-01-01') } });
  
  console.log('VIP10 usedBy cleared, usageLimit increased. FREESHIP 7.7 extended.');
  process.exit(0);
});
