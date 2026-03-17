const express = require('express');
const router = express.Router();
const Controller = require('../../controller/admin/role.controller');

router.get('/', Controller.index);
router.get('/permission', Controller.permission);
router.patch('/permission', Controller.permissionPost);
router.get('/create', Controller.create);
router.post('/create', Controller.createPost);
router.get('/edit/:id', Controller.edit);
router.patch('/edit/:id', Controller.editPost);
router.get('/detail/:id', Controller.detail);
router.patch('/change-activity/:activity/:id', Controller.changeActivity);
// router.delete('/delete/:id', Controller.destroy);

module.exports = router;