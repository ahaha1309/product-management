const crypto = require('crypto');

module.exports.generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
}
module.exports.generateOrderCode=()=> {
  const prefix = "ORD";
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);

  return `${prefix}-${timestamp}-${random}`;
}