const mongoose = require('mongoose');
const RoleSchema = new mongoose.Schema({
  title: String,
  description: String,
  permission:{
    type:Array,
    default:[]
  },
  deleted: {
    type:Boolean,
    default:false
  },
  deletedAt: Date,
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

const Role = mongoose.model('Role', RoleSchema, 'roles');
module.exports = Role;
