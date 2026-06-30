const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // Auto-approve cho demo
  },
  answers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Có thể là User thường hoặc Admin
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Question = mongoose.model('Question', questionSchema, 'questions');
module.exports = Question;
