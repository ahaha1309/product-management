const express=require('express');
const router=express.Router();
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
const uploadMiddleware=require('../../middleware/admin/upload.cloud')
const myAccountController=require('../../controller/admin/my-account.controller');
router.get('/', myAccountController.index);
router.get('/edit', myAccountController.edit);
router.patch('/edit',  upload.single('avatar'),
  uploadMiddleware.upload, myAccountController.editPatch);
module.exports=router;