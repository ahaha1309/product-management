const express = require('express');
const router = express.Router();
const Controller = require('../../controller/admin/dashboard.controller');

router.get('/', Controller.dashboard);
module.exports = router;
