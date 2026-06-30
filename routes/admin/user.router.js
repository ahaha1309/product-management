const express = require('express');
const router = express.Router();
const userController = require('../../controller/admin/user.controller');

router.get('/', userController.index);
router.get('/detail/:id', userController.detail);
router.patch('/change-status/:status/:id', userController.changeStatus);

module.exports = router;
