const mongoose = require('mongoose');
const generate=require('../helper/generate');
const userSchema = new mongoose.Schema({
  fullname: String,
  email: String,
  password: String,
  token: {
    type: String,
    default: generate.generateToken(20)
  },
  confirmPassword:String,
  status:{
    type:String,
    default:'active'
  },
  deleted: {
    type:Boolean,
    default:false
  },
  deletedAt: Date,
},
{
  timestamps:true
});

const User = mongoose.model('User', userSchema, 'users');
module.exports = User;