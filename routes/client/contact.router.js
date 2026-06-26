const express = require('express');
const router = express.Router();
const contactController = require('../../controller/client/contact.controller');

router.get('/', contactController.index);
router.post('/', contactController.post);

module.exports = router;
