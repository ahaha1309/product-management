const express = require('express');
const authController = require('../../controller/admin/auth.controller');
const router = express.Router();
const authValidate=require('../../validate/admin/auth.validate')
const loginLimiter = require('../../helper/login-limiter');

router.get('/login', authController.getLogin);
router.post('/login', loginLimiter.checkLimit, authValidate.loginPost, authController.postLogin);
router.get('/logout', authController.logout);
module.exports = router;