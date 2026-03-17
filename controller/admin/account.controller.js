const account = require('../../models/account.model');
const role=require('../../models/roles.model');
const bcrypt=require('bcrypt');
const fillterButtonHelper = require('../../helper/fillterButton');
const searchHelper = require('../../helper/search');
const paginationHelper = require('../../helper/pagination');
const systemConfig = require('../../config/system');
const createTreeHelper = require('../../helper/createTree');
const categoryModel = require('../../models/product-category.model');

module.exports.index = async (req, res) => {
  const fillterStatus = fillterButtonHelper(req.query);
  let find = {
    deleted: false,
  };
  if (req.query.status) {
    find.status = req.query.status;
  }

  const search = searchHelper(req.query);
  if (search.regex) {
    find.title = search.regex;
  }
  const accounts = await account.find(find).select('-password -token');
  const roles = await role.find({ deleted: false});
  res.render('admin/pages/accounts/index', {
    title: 'Danh sách tài khoản',
    accounts: accounts,
    roles: roles,
    button: fillterStatus,
    keyword: search.keyword,
  });
};
module.exports.changeStatus = async (req, res) => {
  const status = req.params.status;
  const id = req.params.id;

  await account.updateOne({ _id: id }, { status: status });
  req.flash('success', `Cập nhật trạng thái thành công!`);
  res.redirect('back');
};
module.exports.changeActivity = async (req, res) => {
  const activity = req.params.activity;
  const id = req.params.id;
  if (activity == 'delete') {
    await account.updateOne({ _id: id }, { deleted: true, deletedAt: new Date() });
  }
  res.redirect('back');
};
module.exports.changeMulti = async (req, res) => {
  const status = req.body.type;
  const ids = req.body.ids.split(',').filter((id) => id);
  switch (status) {
    case 'active':
      await account.updateMany({ _id: { $in: ids } }, { $set: { status: 'active' } });
      req.flash('success', `Cập nhật trạng thái thành công!`);
      break;
    case 'inactive':
      await account.updateMany({ _id: { $in: ids } }, { $set: { status: 'inactive' } });
      req.flash('success', `Cập nhật trạng thái thành công!`);
      break;
    case 'delete':
      await account.updateMany(
        { _id: { $in: ids } },
        { $set: { deleted: true, deletedAt: new Date() } }
      );
      req.flash('success', `Xóa thành công!`);
      break;
    case 'position':
      let result = ids.map((item) => {
        const [id, position] = item.split(':');
        return {
          id: id,
          position: parseInt(position),
        };
      });
      for (const item of result) {
        await account.updateOne({ _id: item.id }, { $set: { position: item.position } });
      }
      req.flash('success', `Cập nhật vị trí thành công!`);
      break;
    default:
      return res.redirect('back');
  }
  res.redirect('back');
};

module.exports.create = async (req, res) => {
  const roles = await role.find({ deleted: false});
  res.render('admin/pages/accounts/create', {
    title: 'Thêm mới tài khoản',
    roles: roles
  });
};
module.exports.createPost = async (req, res) => {
  try{
  const fullname = req.body.fullname;
  const email = req.body.email;
  const existingAccount = await account.findOne({ _id: { $ne: req.params.id }, email: email, deleted: false });
  if (existingAccount) {
    req.flash('error', 'Email đã tồn tại, vui lòng sử dụng email khác!');
    return res.redirect(`back`);
  }
  const password = req.body.password;
  const phone = req.body.phone;
  const roleId = req.body.roleId;
  const status = req.body.status;
  const data = {
    fullname: fullname,
    email: email,
    password: await bcrypt.hash(password, 10),
    avatar: req.file ? req.body[req.file.fieldname] : '',
    phone: phone,
    roleId: roleId,
    status: status
  };
  await account.create(data);
  res.redirect(`${systemConfig.prefixAdmin}/accounts`);
  } catch (error) {
    console.log("Create Account Error:", error);
    res.redirect(`${systemConfig.prefixAdmin}/accounts/create`);
  }
};
module.exports.edit = async (req, res) => {
  const id = req.params.id;
  try{
  const accountData = await account.findOne({ _id: id, deleted: false });
  const roles = await role.find({ deleted: false });
  res.render('admin/pages/accounts/edit', {
    title: 'Chỉnh sửa tài khoản',
    account: accountData,
    roles: roles
  });    
  } catch (error) {
    console.log("Edit Account Error:", error);
    res.redirect(`${systemConfig.prefixAdmin}/accounts`);
  }
};
module.exports.editPost = async (req, res) => {
  try{
    const accountInit=await account.findOne({ _id: req.params.id, deleted: false });
  const id = req.params.id;
  const fullname = req.body.fullname;
  const email = req.body.email;
  const existingAccount = await account.findOne({ email: email, deleted: false, _id: { $ne: id } });    
  if (existingAccount) {
    req.flash('error', 'Email đã tồn tại, vui lòng sử dụng email khác!');
    return res.redirect('back');
  } 
  const password = req.body.password;
  const phone = req.body.phone;
  const roleId = req.body.roleId; 
  const status = req.body.status;
  const data = {
    fullname: fullname || accountInit.fullname,
    email: email || accountInit.email,
    phone:phone ,
    password: password ? await bcrypt.hash(password, 10) : accountInit.password,
    avatar: req.file ? req.body[req.file.fieldname] : accountInit.avatar,
    roleId: roleId || accountInit.roleId,
    status: status || accountInit.status
  };  
  await account.updateOne({ _id: id }, data);
  res.redirect(`${systemConfig.prefixAdmin}/accounts`);
  req.flash('success', `Cập nhật tài khoản thành công!`);
  } catch (error) {
    console.log("Edit Account Error:", error);
    res.redirect(`${systemConfig.prefixAdmin}/accounts/edit/${id}`);
  }
};