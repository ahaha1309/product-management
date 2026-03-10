const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
//clouddinary
cloudinary.config({
  cloud_name: 'du37o9tc3',
  api_key: '299295694645388',
  api_secret: 'RtnN_4CvHERS-JVdG5Hnflnv_dE',
});
//end
const upload = multer();
const Controller = require('../../controller/admin/product.controller');
const validate = require('../../validate/admin/product.validate');

router.get('/', Controller.product);
router.patch('/change-status/:status/:id', Controller.changeStatus);
router.patch('/change-multi', Controller.changeMulti);
router.patch('/change-activity/:activity/:id', Controller.changeActivity);
router.get('/create', Controller.create);
router.post(
  '/create',
  upload.single('thumbnail'),
  function (req, res, next) {
    if (req.file) {
      let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
          let stream = cloudinary.uploader.upload_stream((error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          });

          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };

      async function upload(req) {
        let result = await streamUpload(req);
        req.body[req.file.fieldname] = result.url;
        next();
      }

      upload(req); 
    } else {
      next();
    }
  },
  validate.createPost,
  Controller.createPost
);
router.get('/edit/:id', Controller.edit);
router.patch(
  '/edit/:id',
  upload.single('thumbnail'),
  function (req, res, next) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      console.log(result);
    }

    upload(req);
  },
  validate.createPost,
  Controller.editPost
);
router.get('/detail/:id', Controller.detail);
module.exports = router;
