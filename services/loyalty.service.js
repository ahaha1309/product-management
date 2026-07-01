const User = require('../models/user.model');
// Mongoose transaction if needed later, but simplified for now

class LoyaltyService {
  /**
   * Adds points to a user account based on order amount
   * Configured at 1% of total amount by default
   */
  async addPointsForPurchase(userId, orderId, amount) {
    try {
      const pointsEarned = Math.floor(amount * 0.01); // 1% points
      
      await User.updateOne(
        { _id: userId },
        { 
          $inc: { points: pointsEarned },
          $push: { 
            pointHistory: {
              orderId: orderId,
              points: pointsEarned,
              reason: 'Mua hàng',
              date: new Date()
            }
          }
        }
      );
      
      return pointsEarned;
    } catch (err) {
      console.error("Error in LoyaltyService.addPointsForPurchase:", err);
      // Fail silently to not interrupt checkout flow
      return 0;
    }
  }
}

module.exports = new LoyaltyService();
