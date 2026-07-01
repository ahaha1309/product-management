const express = require('express');
const router = express.Router();
const controller = require('../../controller/admin/supplier.controller');

router.get('/', controller.index);

router.get('/create', controller.createGet);
router.post('/create', controller.createPost);

router.get('/edit/:id', controller.editGet);
router.patch('/edit/:id', controller.editPatch);

router.delete('/delete/:id', controller.deleteItem);

module.exports = router;
