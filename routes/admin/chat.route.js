const express = require('express');
const router = express.Router();
const controller = require('../../controller/admin/chat.controller');

router.get('/', controller.index);
router.get('/history/:userId', controller.history);
router.post('/send', controller.send);
router.post('/take/:userId', controller.take);
router.post('/return/:userId', controller.returnBot);
router.post('/close/:userId', controller.closeConversation);

module.exports = router;
