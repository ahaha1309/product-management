const mongoose = require('mongoose');
const slug=require('mongoose-slug-updater');
mongoose.plugin(slug);
const Articleschema = new mongoose.Schema({
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

const articleCategory = mongoose.model('article-category', Articleschema, 'article-category');
module.exports = articleCategory;
