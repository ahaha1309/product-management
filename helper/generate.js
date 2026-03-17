const crypto = require('crypto');

module.exports.generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
}
