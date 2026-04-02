const express=require('express');
const router=express.Router();
const articleController=require('../../controller/admin/article.controller');
router.get('/', articleController.index);
module.exports=router;