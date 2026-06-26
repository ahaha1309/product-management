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

module.exports.generateRandomNumber = (length) => {
  const characters = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

module.exports.generateRandomString = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};