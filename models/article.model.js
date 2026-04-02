const mongoose = require('mongoose');
const slug=require('mongoose-slug-updater');
mongoose.plugin(slug);
const Articleschema = new mongoose.Schema({
  title: String,
  description: String,
  article_category_id: {
    type: String,
   default: ''
  },
  thumbnail: String,
  status: String,
  position: Number,
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

const Article = mongoose.model('Article', Articleschema, 'articles');
module.exports = Article;
