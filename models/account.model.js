const mongoose = require('mongoose');
const generate=require('../helper/generate');
const accountSchema = new mongoose.Schema({
  fullname: String,
  email: String,
  password: String,
  token: {
    type: String,
    default: generate.generateToken(20)
  },
  phone:String,
  avatar:String,
  roleId:String,
  status:String,
  deleted: {
    type:Boolean,
    default:false
  },
  deletedAt: Date,
},
{
  timestamps:true
});

const Account = mongoose.model('Account', accountSchema, 'accounts');
module.exports = Account;