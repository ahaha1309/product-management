const mongoose = require('mongoose');
const generate=require('../helper/generate');
const userSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  avatar:String,
  address:String,
  phone:String,
  password: String,
  token: {
    type: String,
    default: () => generate.generateToken(20)
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
  totalSpent: {
    type: Number,
    default: 0
  },
  tier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Diamond'],
    default: 'Bronze'
  }
},
{
  timestamps:true
});

const User = mongoose.model('User', userSchema, 'users');
module.exports = User;