const NodeCache = require('node-cache');
// Cache tồn tại 5 phút (300 giây)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

module.exports.cacheRoute = (duration) => {
  return (req, res, next) => {
    // Tạm thời tắt full-page cache vì nó làm cache luôn cả trạng thái Đăng nhập và Số lượng Giỏ hàng của user
    // Các truy vấn nặng đã được cache riêng ở mức database trong controller
    next();
  };
};

module.exports.clearCache = (key) => {
  if (key) {
    cache.del(key);
  } else {
    cache.flushAll();
  }
};
