const categoryModel=require('../models/product-category.model')
const getSubCategory=async(parentId)=>{
      const subs = await categoryModel.find({
        parent_id: parentId
      });
      
      let allSub=[...subs];
      for( sub of subs){
        const child=await getSubCategory(sub.id)
        allSub=allSub.concat(child)
      }
      return allSub;
    }
module.exports.getSubCategory=getSubCategory