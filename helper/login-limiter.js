const NodeCache = require('node-cache');
// Cache tồn tại trong 15 phút
const cache = new NodeCache({ stdTTL: 15 * 60, checkperiod: 120 });

module.exports = {
  checkLimit: (req, res, next) => {
    const attempts = cache.get(req.ip) || 0;
    if (attempts >= 5) {
      req.flash('error', 'Quá nhiều lần đăng nhập sai, vui lòng thử lại sau 15 phút.');
      return res.redirect('back');
    }
    next();
  },
  
  incrementFailed: (req) => {
    const attempts = (cache.get(req.ip) || 0) + 1;
    cache.set(req.ip, attempts);
    return attempts;
  },
  
  reset: (req) => {
    cache.del(req.ip);
  }
};
