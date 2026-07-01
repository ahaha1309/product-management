const Supplier = require('../../models/supplier.model');

// [GET] /admin/suppliers
module.exports.index = async (req, res) => {
  try {
    let find = {
      deleted: false
    };

    // Keyword Search
    if (req.query.keyword) {
      const regex = new RegExp(req.query.keyword, 'i');
      find.name = regex;
    }

    const suppliers = await Supplier.find(find).sort({ createdAt: -1 });

    res.render('admin/pages/suppliers/index', {
      pageTitle: 'Danh sách Nhà Cung Cấp',
      suppliers: suppliers,
      keyword: req.query.keyword
    });
  } catch (error) {
    res.redirect('back');
  }
};

// [GET] /admin/suppliers/create
module.exports.createGet = (req, res) => {
  res.render('admin/pages/suppliers/create', {
    pageTitle: 'Thêm mới Nhà Cung Cấp'
  });
};

// [POST] /admin/suppliers/create
module.exports.createPost = async (req, res) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();
    req.flash('success', 'Thêm mới nhà cung cấp thành công!');
    res.redirect('/admin/suppliers');
  } catch (error) {
    req.flash('error', 'Có lỗi xảy ra!');
    res.redirect('back');
  }
};

// [GET] /admin/suppliers/edit/:id
module.exports.editGet = async (req, res) => {
  try {
    const id = req.params.id;
    const supplier = await Supplier.findOne({ _id: id, deleted: false });
    
    if (!supplier) {
      return res.redirect('/admin/suppliers');
    }

    res.render('admin/pages/suppliers/edit', {
      pageTitle: 'Chỉnh sửa Nhà Cung Cấp',
      supplier: supplier
    });
  } catch (error) {
    res.redirect('back');
  }
};

// [PATCH] /admin/suppliers/edit/:id
module.exports.editPatch = async (req, res) => {
  try {
    const id = req.params.id;
    await Supplier.updateOne({ _id: id }, req.body);
    req.flash('success', 'Cập nhật thành công!');
    res.redirect('/admin/suppliers');
  } catch (error) {
    req.flash('error', 'Có lỗi xảy ra!');
    res.redirect('back');
  }
};

// [DELETE] /admin/suppliers/delete/:id
module.exports.deleteItem = async (req, res) => {
  try {
    const id = req.params.id;
    await Supplier.updateOne(
      { _id: id },
      { deleted: true, deletedAt: new Date() }
    );
    req.flash('success', 'Đã xóa nhà cung cấp!');
    res.redirect('back');
  } catch (error) {
    req.flash('error', 'Có lỗi xảy ra!');
    res.redirect('back');
  }
};
