const express=require('express');
const router=express.Router();
const cartController=require('../../controller/client/cart.controller')

router.get('/',cartController.index)
router.post('/add/:id',cartController.addProduct);
router.patch('/delete/:id',cartController.deleteProduct);
router.patch('/update-quantity/:id/:quantity',cartController.updateQuantity);

module.exports=router