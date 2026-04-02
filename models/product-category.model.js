const mongoose = require('mongoose');
const slug=require('mongoose-slug-updater');
mongoose.plugin(slug);
const Categoryschema = new mongoose.Schema({
  title: String,
  description: String,
  parent_id:{
    type:String,
    default:''
  },
  thumbnail: String,
  status: String,
  position: Number,
  deleted: {
    type:Boolean,
    default:false
  },
  deletedAt: Date,
  slug:{
    type:String,
    slug:"title",
    unique:true
  },
  updatedBy:[
    {
      accountId:String,
      updatedAt: Date,
    }
  ],
},
{
  timestamps:true
});

const productCategory = mongoose.model('product-category', Categoryschema, 'product-category');
module.exports = productCategory;
