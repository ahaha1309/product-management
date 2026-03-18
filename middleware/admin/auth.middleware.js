const systemConfig = require('../../config/system');
const account = require('../../models/account.model');
const roleModel = require('../../models/roles.model');
module.exports.requireAuth =async (req, res, next) => {
  if (!req.cookies.token) {
    return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
  }
  const accountExist= await account.findOne({
    token: req.cookies.token
  }).select('-password');
  if (!accountExist) {
    return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
  }
  const role=await roleModel.findById(accountExist.roleId).select('title permission');
  res.locals.role=role;
  res.locals.account = accountExist;
  next();
};