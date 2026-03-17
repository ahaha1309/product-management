const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const uploadMiddleware=require('../../middleware/admin/upload.cloud')
const Controller = require('../../controller/admin/account.controller');
const validate = require('../../validate/admin/account.validate');

router.get('/', Controller.index);
router.patch('/change-status/:status/:id', Controller.changeStatus);
router.patch('/change-multi', Controller.changeMulti);
router.patch('/change-activity/:activity/:id', Controller.changeActivity);
router.get('/create', Controller.create);
router.post(
  '/create',
  upload.single('thumbnail'),
  uploadMiddleware.upload,
  validate.createPost,
  Controller.createPost
);
router.get('/edit/:id', Controller.edit);
router.patch(
  '/edit/:id',
  upload.single('thumbnail'),
  uploadMiddleware.upload,
  validate.editPatch,
  Controller.editPost
);
// router.get('/detail/:id', Controller.detail);
module.exports = router;
