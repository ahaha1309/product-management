const express=require('express');
const router=express.Router();
const authController=require('../../controller/client/auth.controller')

router.get('/login',authController.loginGet)
router.post('/login',authController.loginPost)
router.get('/register',authController.registerGet)
router.post('/register',authController.registerPost)
router.get('/logout',authController.logout)

// OTP Verification
router.get('/verify-otp', authController.verifyOtpGet)
router.post('/verify-otp', authController.verifyOtpPost)

// Forgot Password
router.get('/forgot-password', authController.forgotPasswordGet)
router.post('/forgot-password', authController.forgotPasswordPost)

// Reset Password
router.get('/reset-password', authController.resetPasswordGet)
router.post('/reset-password', authController.resetPasswordPost)

// Resend OTP
router.post('/resend-otp', authController.resendOtpPost)

module.exports=router