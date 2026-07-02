const express = require('express');
const router = express.Router();
const controller = require('../../controller/client/chat.controller');

router.get('/history', controller.history);
router.post('/send', controller.send);

module.exports = router;
