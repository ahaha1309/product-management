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
const userController=require('../../controller/client/user.controller');

router.get('/:id',userController.index);
router.get('/edit/:id',userController.editGet);
router.post('/edit/:id',upload.single('avatar'),uploadMiddleware.upload,userController.editPost);

module.exports=router