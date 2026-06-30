const express = require('express');
const router = express.Router();
const controller = require('../../controller/admin/order.controller'); // Sửa đường dẫn chuẩn với project của bạn

router.get('/', controller.index);
router.patch('/change-status/:id', controller.changeStatus);
router.patch('/change-payment-status/:id', controller.changePaymentStatus);
router.get('/detail/:id', controller.detail);
router.get('/print/:id', controller.printInvoice);
router.get('/export-csv', controller.exportCsv);

module.exports = router;