const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const uploadMiddleware=require('../../middleware/admin/upload.cloud')
const Controller = require('../../controller/admin/category-product.controller');
const validate = require('../../validate/admin/product-category.validate');

router.get('/', Controller.index);
router.get('/create', Controller.create);
router.post(
  '/create',
  upload.single('thumbnail'),
  uploadMiddleware.upload,
//   validate.createPost,
  Controller.createPost
);
module.exports = router;
