const express=require( "express");
const router = express.Router();
const orderController=require('../../controller/client/order.controller');
const authMiddleware = require('../../middleware/client/auth.middleware');

// GET trang checkout
router.get("/", authMiddleware.requireAuth, orderController.index);
//get trang đơn hàng
router.get('/history', authMiddleware.requireAuth, orderController.historyOrder)
router.get('/detail/:id', authMiddleware.requireAuth, orderController.detailOrder)
router.get('/print/:id', authMiddleware.requireAuth, orderController.printInvoice)
//hủy đơn hàng
router.post('/cancel/:id', authMiddleware.requireAuth, orderController.cancelOrder)
//mua lại
router.get('/rebuy/:id', authMiddleware.requireAuth, orderController.rebuyOrder)
//post update infouser
router.post('/update-info', authMiddleware.requireAuth, orderController.editInfo)
// POST validate voucher via AJAX
router.post('/validate-voucher', authMiddleware.requireAuth, orderController.validateVoucher);
// POST đặt hàng
router.post("/create-payment-url", authMiddleware.requireAuth, orderController.createPaymentUrl);
router.get('/vnpay-return', orderController.vnpReturn)
router.get('/vnpay-ipn', orderController.vnpayIPN)

module.exports= router;