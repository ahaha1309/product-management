const express=require( "express");
const router = express.Router();
const orderController=require('../../controller/client/order.controller')
// GET trang checkout
router.get("/", orderController.index);

// POST đặt hàng
router.post("/create-payment-url",orderController.createPaymentUrl);
router.get('/vnpay-return',orderController.vnpReturn)
router.get('/vnpay-ipn',orderController.vnpayIPN)

module.exports= router;