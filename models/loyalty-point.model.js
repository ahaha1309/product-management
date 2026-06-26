const mongoose = require('mongoose');

const loyaltyPointSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  currentLevel: {
    type: String,
    enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
    default: 'BRONZE'
  },
  // Lịch sử các transaction point
  transactions: [
    {
      type: {
        type: String,
        enum: ['purchase', 'review', 'referral', 'share', 'reward_redemption', 'admin_bonus'],
        required: true
      },
      points: Number,
      description: String,
      orderId: String, // Nếu liên quan đến đơn hàng
      productId: String, // Nếu liên quan đến sản phẩm
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  // Lịch sử các reward đã dùng
  redeemedRewards: [
    {
      rewardId: String,
      pointsUsed: Number,
      redeemedAt: {
        type: Date,
        default: Date.now
      },
      expiresAt: Date
    }
  ],
  lastRedeemDate: Date,
  nextMilestonePoints: Number, // Điểm cần để lên level tiếp
  tier: {
    type: Object,
    default: {
      bronze: { minPoints: 0, discountPercent: 0 },
      silver: { minPoints: 100, discountPercent: 5 },
      gold: { minPoints: 300, discountPercent: 10 },
      platinum: { minPoints: 500, discountPercent: 15 }
    }
  }
},
{
  timestamps: true
});

loyaltyPointSchema.index({ userId: 1 });
loyaltyPointSchema.index({ totalPoints: 1 });
loyaltyPointSchema.index({ currentLevel: 1 });

const LoyaltyPoint = mongoose.model('LoyaltyPoint', loyaltyPointSchema, 'loyalty_points');
module.exports = LoyaltyPoint;
