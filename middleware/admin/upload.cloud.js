const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
//clouddinary
cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});
//end
module.exports.upload = (req, res, next) => {
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

    upload(req).catch((error) => {
      console.error("Cloudinary upload error:", JSON.stringify(error));
      next(error);
    });
  } else {
    next();
  }
};

module.exports.uploadMultiple = async (req, res, next) => {
  if (req.files && req.files.length > 0) {
    let streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) resolve(result.url);
          else reject(error);
        });
        streamifier.createReadStream(fileBuffer).pipe(stream);
      });
    };

    try {
      const urls = [];
      for (const file of req.files) {
        const url = await streamUpload(file.buffer);
        urls.push(url);
      }
      req.body[req.files[0].fieldname] = urls; // e.g. req.body.images = [url1, url2]
      next();
    } catch (error) {
      console.error("Cloudinary multi-upload error:", JSON.stringify(error));
      next(error);
    }
  } else {
    next();
  }
};
