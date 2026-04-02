const roleModel=require('../../models/roles.model');
const systemConfig = require('../../config/system');
module.exports.index = async (req, res) => {
  const roles=await roleModel.find({deleted:false});
  res.render('admin/pages/roles/index', {
    title: 'Nhóm quyền',
    roles: roles
  });
};

module.exports.create = async (req, res) => {
  res.render('admin/pages/roles/create', {
    title: 'Thêm nhóm quyền',
    //  categories: categories,
  });
}
module.exports.createPost = async (req, res) => {
  try {
    const title = req.body.title;       
    const description = req.body.description;
    const data = {
      title: title,
        description: description,
    }
    await roleModel.create(data);
    res.redirect(`${systemConfig.prefixAdmin}/roles`);
  } catch (error) {
    console.log("Create Role Error:", error);
    res.redirect(`${systemConfig.prefixAdmin}/roles`);
  } 
}
module.exports.edit = async (req, res) => {
    try{
  const id = req.params.id;
  const role = await roleModel.findById(id);
  res.render('admin/pages/roles/edit', {
    title: 'Sửa nhóm quyền',
    role: role
  });
} catch (error) {
  req.flash('error', 'Không tồn tại nhóm quyền này');
  res.redirect(`${systemConfig.prefixAdmin}/roles`);
}
};
module.exports.editPost= async (req, res) => {
  const id = req.params.id;
  const title = req.body.title;
  const description = req.body.description;

  try {
    await roleModel.updateOne(id, { title: title, description: description, $push: { updatedBy: { accountId: res.locals.account.id, updatedAt: new Date() } } });
    req.flash('success', 'Cập nhật nhóm quyền thành công');
    res.redirect(`${systemConfig.prefixAdmin}/roles`);
  } catch (error) {
    console.log("Edit Role Error:", error);
    res.redirect(`${systemConfig.prefixAdmin}/roles`);
  }
};
module.exports.permission = async (req, res) => {
  const roles=await roleModel.find({deleted:false});
  res.render('admin/pages/roles/permission', {
    title: 'Phân quyền',
    roles: roles,
    //  categories: categories,
  });
}
module.exports.permissionPost = async (req, res) => {
  const permissions = JSON.parse(req.body.permissions);
  for (const item of permissions) {
    const roleId = item.roleId;
    const permissions = item.permissions;
    await roleModel.findByIdAndUpdate(roleId, { permission: permissions });
  }
  req.flash('success', 'Cập nhật quyền thành công');
  res.redirect('back');
}
module.exports.detail = async (req, res) => {
  const id = req.params.id; 
  try {
    const role = await roleModel.findById(id);
    if (!role) {
      req.flash('error', 'Không tồn tại nhóm quyền này');
      return res.redirect(`${systemConfig.prefixAdmin}/roles`);
    }   
    res.render('admin/pages/roles/detail', {
      title: 'Chi tiết nhóm quyền',
      role: role,
    });
  } catch (error) {
    console.log("Detail Role Error:", error);
    req.flash('error', 'Không tồn tại nhóm quyền này');
    res.redirect(`${systemConfig.prefixAdmin}/roles`);
  } };
module.exports.changeActivity = async (req, res) => {
  const activity = req.params.activity;
  const id = req.params.id;
  if (activity == 'delete') {
    await roleModel.updateOne({ _id: id }, { deleted: true, deletedAt: new Date() });
  }
  res.redirect('back');
};