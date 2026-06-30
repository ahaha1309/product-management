const express = require('express');
const router = express.Router();
const controller = require('../../controller/admin/voucher.controller');

router.get('/', controller.index);
router.get('/create', controller.createGet);
router.post('/create', controller.createPost);
router.get('/edit/:id', controller.editGet);
router.patch('/edit/:id', controller.editPatch);
router.delete('/delete/:id', controller.delete);

module.exports = router;
