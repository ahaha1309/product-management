const express = require('express');
const router = express.Router();
const policyController = require('../../controller/client/policy.controller');

router.get('/return', policyController.returnPolicy);
router.get('/privacy', policyController.privacyPolicy);

module.exports = router;
