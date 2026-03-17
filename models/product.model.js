const mongoose = require('mongoose');
const slug=require('mongoose-slug-updater');
mongoose.plugin(slug);
const Productschema = new mongoose.Schema({
  title: String,
  description: String,
  product_category_id: {
    type: String,
   default: ''
  },
  price: Number,
  discountPercentage: Number,
  stock: Number,
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
  }
},
{
  timestamps:true
});

const Product = mongoose.model('Product', Productschema, 'products');
module.exports = Product;
