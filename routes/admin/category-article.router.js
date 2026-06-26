const express = require('express');
const router = express.Router();
const categoryArticleController = require('../../controller/admin/category-article.controller');
const uploadCloud = require('../../middleware/admin/upload.cloud');
const multer = require('multer');
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép tải lên hình ảnh!'), false);
    }
  }
});

router.get('/', categoryArticleController.index);
router.get('/detail/:id', categoryArticleController.detail);
router.get('/create', categoryArticleController.create);
router.post('/create', upload.single('thumbnail'), uploadCloud.upload, categoryArticleController.createPost);
router.get('/edit/:id', categoryArticleController.edit);
router.patch('/edit/:id', upload.single('thumbnail'), uploadCloud.upload, categoryArticleController.editPatch);

module.exports = router;