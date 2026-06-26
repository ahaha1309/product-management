const express=require('express');
const router=express.Router();
const articleController=require('../../controller/admin/article.controller');
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

router.get('/', articleController.index);
router.get('/detail/:id', articleController.detail);
router.get('/create', articleController.create);
router.post('/create', upload.single('thumbnail'), uploadCloud.upload, articleController.createPost);
router.get('/edit/:id', articleController.edit);
router.patch('/edit/:id', upload.single('thumbnail'), uploadCloud.upload, articleController.editPatch);

module.exports=router;