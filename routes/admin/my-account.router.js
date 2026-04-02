const express=require('express');
const router=express.Router();
const multer = require('multer');
const upload = multer();
const uploadMiddleware=require('../../middleware/admin/upload.cloud')
const myAccountController=require('../../controller/admin/my-account.controller');
router.get('/', myAccountController.index);
router.get('/edit', myAccountController.edit);
router.patch('/edit',  upload.single('avatar'),
  uploadMiddleware.upload, myAccountController.editPatch);
module.exports=router;