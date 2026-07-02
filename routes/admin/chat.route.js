const express = require('express');
const router = express.Router();
const controller = require('../../controller/admin/chat.controller');

router.get('/', controller.index);
router.get('/history/:userId', controller.history);
router.post('/send', controller.send);

module.exports = router;
