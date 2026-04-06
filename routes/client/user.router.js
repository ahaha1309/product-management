const express=require('express');
const router=express.Router();
const multer = require('multer');
const upload = multer();
const uploadMiddleware=require('../../middleware/admin/upload.cloud')
const userController=require('../../controller/client/user.controller');

router.get('/:id',userController.index);
router.get('/edit/:id',userController.editGet);
router.post('/edit/:id',upload.single('avatar'),uploadMiddleware.upload,userController.editPost);

module.exports=router