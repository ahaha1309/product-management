const express=require( "express");
const router = express.Router();
const orderController=require('../../controller/client/order.controller');
const { randomInt } = require("crypto");
// GET trang checkout
router.get("/", orderController.index);
//get trang đơn hàng
router.get('/history',orderController.historyOrder)
router.get('/detail/:id',orderController.detailOrder)
//hủy đơn hàng
router.post('/cancel/:id',orderController.cancelOrder)
//mua lại
router.get('/rebuy/:id',orderController.rebuyOrder)
//post update infouser
router.post('/update-info',orderController.editInfo)
// POST đặt hàng
router.post("/create-payment-url",orderController.createPaymentUrl);
router.get('/vnpay-return',orderController.vnpReturn)
router.get('/vnpay-ipn',orderController.vnpayIPN)

module.exports= router;