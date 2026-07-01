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
  supplier_id: {
    type: String,
    default: ''
  },
  price: Number,
  discountPercentage: Number,
  stock: Number,
  thumbnail: String,
  images: {
    type: Array,
    default: []
  },
  status: String,
  position: Number,
  techSpecs: {
    type: [{
      name: String,
      value: String
    }],
    default: []
  },
  requireVariants: {
    type: Boolean,
    default: true
  },
  createdBy: {
    accountId:String,
    createdAt:{
      type: Date,
      default: Date.now
    }
  },
  deleted: {
    type:Boolean,
    default:false
  },
  deletedBy: {
    accountId:String,
    deletedAt: Date,
    },
  slug:{
    type:String,
    slug:"title",
    unique:true,
    slugOn: { update: true } 
  },
  updatedBy:[
    {
      accountId:String,
      updatedAt: Date,
    }
  ],
  featured: {
    type: Boolean,
    default: false
  }
},
{
  timestamps:true
});

Productschema.index({ status: 1, deleted: 1 });
Productschema.index({ product_category_id: 1 });
Productschema.index({ featured: 1, deleted: 1 });

const Product = mongoose.model('Product', Productschema, 'products');
module.exports = Product;
