const express = require('express');
const router = express.Router();
const multer = require('multer');
const storageMulter=require('../../helper/storageMulter')
const upload=multer({storage:storageMulter(multer)})
const Controller = require('../../controller/admin/product.controller');
const validate=require('../../validate/admin/product.validate')

router.get('/', Controller.product);
router.patch('/change-status/:status/:id', Controller.changeStatus);
router.patch('/change-multi', Controller.changeMulti);
router.patch('/change-activity/:activity/:id', Controller.changeActivity);
router.get('/create', Controller.create);
router.post('/create', upload.single('thumbnail'),validate.createPost, Controller.createPost);
router.get('/edit/:id',Controller.edit);
router.patch('/edit/:id', upload.single('thumbnail'),validate.createPost, Controller.editPost);
router.get('/detail/:id',Controller.detail);
module.exports = router;
