const LoyaltyPoint = require('../../models/loyalty-point.model');
const Order = require('../../models/orders.model');
const Review = require('../../models/review.model');

// Cấu hình điểm thưởng
const POINT_CONFIG = {
  PURCHASE_PERCENTAGE: 1, // 1 điểm / 10k VNĐ (có thể điều chỉnh)
  REVIEW: 5, // 5 điểm cho mỗi review
  REFERRAL: 50, // 50 điểm cho mỗi referral thành công
  SHARE: 3, // 3 điểm cho mỗi share
  BIRTHDAY: 100 // 100 điểm vào sinh nhật
};

// Tier config
const TIER_CONFIG = {
  BRONZE: { min: 0, max: 99, discount: 0 },
  SILVER: { min: 100, max: 299, discount: 5 },
  GOLD: { min: 300, max: 499, discount: 10 },
  PLATINUM: { min: 500, max: Infinity, discount: 15 }
};

// [GET] Thông tin loyalty của user
module.exports.getUserLoyalty = async (req, res) => {
  try {
    const userId = res.locals.user._id;

    let loyalty = await LoyaltyPoint.findOne({ userId: userId });

    if (!loyalty) {
      return res.redirect('/loyalty/register');
    }

    const tierInfo = getTierInfo(loyalty.totalPoints);

    res.render('client/pages/loyalty/index', {
      title: 'Chương trình thành viên',
      loyalty: loyalty,
      tierInfo: tierInfo,
      pointConfig: POINT_CONFIG
    });

  } catch (error) {
    console.log(error);
    res.redirect('back');
  }
};

// [GET] Dashboard loyalty (xem điểm + reward)
module.exports.dashboard = async (req, res) => {
  try {
    const userId = res.locals.user._id;

    let loyalty = await LoyaltyPoint.findOne({ userId: userId });

    if (!loyalty) {
      return res.redirect('/loyalty/register');
    }

    const tierInfo = getTierInfo(loyalty.totalPoints);
    const availableRewards = getAvailableRewards(loyalty.totalPoints);

    res.render('client/pages/loyalty/dashboard', {
      title: 'Dashboard Loyalty',
      loyalty: loyalty,
      tierInfo: tierInfo,
      availableRewards: availableRewards
    });

  } catch (error) {
    res.redirect('back');
  }
};

// [POST] Thêm điểm khi mua hàng (gọi từ order controller)
module.exports.addPointsForPurchase = async (orderId, amount) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) return;

    // Tính điểm: 1 điểm / 10k VNĐ
    const points = Math.floor(amount / 10000) * POINT_CONFIG.PURCHASE_PERCENTAGE;

    let loyalty = await LoyaltyPoint.findOne({ userId: order.userId });

    if (!loyalty) {
      loyalty = new LoyaltyPoint({ userId: order.userId });
    }

    loyalty.totalPoints += points;
    loyalty.transactions.push({
      type: 'purchase',
      points: points,
      description: `Mua hàng đơn #${order.orderCode}`,
      orderId: orderId
    });

    // Cập nhật tier
    updateTier(loyalty);

    await loyalty.save();

    return loyalty;

  } catch (error) {
    console.log('Error adding points:', error);
  }
};

// [POST] Thêm điểm khi review
module.exports.addPointsForReview = async (reviewId) => {
  try {
    const review = await Review.findById(reviewId);
    if (!review || review.status !== 'approved') return;

    let loyalty = await LoyaltyPoint.findOne({ userId: review.userId });

    if (!loyalty) {
      loyalty = new LoyaltyPoint({ userId: review.userId });
    }

    // Kiểm tra xem đã nhận điểm cho review này chưa
    const existingTransaction = loyalty.transactions.find(t => 
      t.type === 'review' && t.description.includes(reviewId)
    );

    if (!existingTransaction) {
      loyalty.totalPoints += POINT_CONFIG.REVIEW;
      loyalty.transactions.push({
        type: 'review',
        points: POINT_CONFIG.REVIEW,
        description: `Viết review sản phẩm`,
        productId: review.productId
      });

      updateTier(loyalty);
      await loyalty.save();
    }

  } catch (error) {
    console.log('Error adding review points:', error);
  }
};

// [POST] Redemption (dùng điểm để nhận thưởng)
module.exports.redeemReward = async (req, res) => {
  try {
    const userId = res.locals.user._id;
    const { rewardId, pointsToRedeem } = req.body;

    let loyalty = await LoyaltyPoint.findOne({ userId: userId });

    if (!loyalty || loyalty.totalPoints < pointsToRedeem) {
      return res.status(400).json({
        code: '01',
        message: 'Điểm không đủ'
      });
    }

    // Trừ điểm
    loyalty.totalPoints -= pointsToRedeem;

    // Ghi nhận redemption
    loyalty.redeemedRewards.push({
      rewardId: rewardId,
      pointsUsed: pointsToRedeem,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 ngày
    });

    loyalty.lastRedeemDate = new Date();

    // Ghi nhận transaction
    loyalty.transactions.push({
      type: 'reward_redemption',
      points: -pointsToRedeem,
      description: `Dùng điểm để nhận thưởng`,
      createdAt: new Date()
    });

    updateTier(loyalty);
    await loyalty.save();

    res.status(200).json({
      code: '00',
      message: 'Thưởng đã được kích hoạt',
      loyalty: loyalty
    });

  } catch (error) {
    res.status(500).json({
      code: '99',
      message: 'Lỗi'
    });
  }
};

// [GET] Lịch sử transaction điểm
module.exports.transactionHistory = async (req, res) => {
  try {
    const userId = res.locals.user._id;

    const loyalty = await LoyaltyPoint.findOne({ userId: userId });

    if (!loyalty) {
      return res.redirect('/loyalty/register');
    }

    res.render('client/pages/loyalty/history', {
      title: 'Lịch sử điểm',
      loyalty: loyalty,
      transactions: loyalty.transactions.sort((a, b) => b.createdAt - a.createdAt)
    });

  } catch (error) {
    res.redirect('back');
  }
};

// ==================== HELPER FUNCTIONS ====================

function getTierInfo(points) {
  let tier = 'BRONZE';
  
  for (const [tierName, config] of Object.entries(TIER_CONFIG)) {
    if (points >= config.min && points <= config.max) {
      tier = tierName;
      break;
    }
  }

  const currentTier = TIER_CONFIG[tier];
  const nextTier = getNextTier(tier);
  const nextTierConfig = nextTier ? TIER_CONFIG[nextTier] : null;

  return {
    currentTier: tier,
    currentPoints: points,
    discount: currentTier.discount,
    nextTier: nextTier,
    pointsToNextTier: nextTierConfig ? Math.max(0, nextTierConfig.min - points) : 0,
    progress: calculateProgress(points, tier)
  };
}

function getNextTier(currentTier) {
  const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
  const index = tiers.indexOf(currentTier);
  return index < tiers.length - 1 ? tiers[index + 1] : null;
}

function calculateProgress(points, tier) {
  const config = TIER_CONFIG[tier];
  const nextTier = getNextTier(tier);
  const nextConfig = nextTier ? TIER_CONFIG[nextTier] : null;

  if (!nextConfig) return 100;

  const progressRange = nextConfig.min - config.min;
  const progressCurrent = points - config.min;

  return Math.min(100, Math.round((progressCurrent / progressRange) * 100));
}

function updateTier(loyalty) {
  let newTier = 'BRONZE';
  
  for (const [tierName, config] of Object.entries(TIER_CONFIG)) {
    if (loyalty.totalPoints >= config.min) {
      newTier = tierName;
    }
  }

  loyalty.currentLevel = newTier;
}

function getAvailableRewards(points) {
  return [
    {
      id: 'discount_5',
      name: 'Giảm 5%',
      pointsRequired: 50,
      description: 'Giảm 5% cho lần mua tiếp theo',
      icon: '🎁',
      available: points >= 50
    },
    {
      id: 'discount_10',
      name: 'Giảm 10%',
      pointsRequired: 100,
      description: 'Giảm 10% cho lần mua tiếp theo',
      icon: '🎉',
      available: points >= 100
    },
    {
      id: 'free_shipping',
      name: 'Miễn phí vận chuyển',
      pointsRequired: 75,
      description: 'Áp dụng cho 1 lần mua tiếp theo',
      icon: '🚚',
      available: points >= 75
    },
    {
      id: 'exclusive_product',
      name: 'Sản phẩm độc quyền',
      pointsRequired: 200,
      description: 'Truy cập sản phẩm chỉ dành cho thành viên',
      icon: '⭐',
      available: points >= 200
    }
  ];
}

module.exports.TIER_CONFIG = TIER_CONFIG;
module.exports.POINT_CONFIG = POINT_CONFIG;

// [GET] Trang đăng ký tham gia chương trình khách hàng thân thiết
module.exports.getRegister = async (req, res) => {
  try {
    const userId = res.locals.user._id;
    const loyalty = await LoyaltyPoint.findOne({ userId: userId });

    // Nếu đã là thành viên thì chuyển thẳng vào dashboard
    if (loyalty) {
      return res.redirect('/loyalty/dashboard');
    }

    res.render('client/pages/loyalty/register', {
      title: 'Đăng ký chương trình thành viên'
    });
  } catch (error) {
    res.redirect('back');
  }
};

// [POST] Đăng ký tham gia chương trình khách hàng thân thiết
module.exports.postRegister = async (req, res) => {
  try {
    const userId = res.locals.user._id;
    let loyalty = await LoyaltyPoint.findOne({ userId: userId });

    if (!loyalty) {
      loyalty = new LoyaltyPoint({ userId: userId });
      await loyalty.save();
      req.flash('success', 'Chào mừng bạn đến với VanHa Rewards! 🎉');
    }

    res.redirect('/loyalty/dashboard');
  } catch (error) {
    res.redirect('back');
  }
};
