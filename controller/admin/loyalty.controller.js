const LoyaltyPoint = require('../../models/loyalty-point.model');
const User = require('../../models/user.model');

// [GET] /admin/loyalty - Danh sách loyalty members
module.exports.index = async (req, res) => {
  try {
    const loyalties = await LoyaltyPoint.find().sort({ totalPoints: -1 });

    // Attach user info
    const loyaltiesWithUsers = await Promise.all(loyalties.map(async (loy) => {
      const user = await User.findById(loy.userId).select('fullName email avatar');
      return {
        ...loy.toObject(),
        user: user || { fullName: 'Không tìm thấy', email: 'N/A' }
      };
    }));

    // Stats
    const stats = {
      total: loyalties.length,
      bronze: loyalties.filter(l => l.currentLevel === 'BRONZE').length,
      silver: loyalties.filter(l => l.currentLevel === 'SILVER').length,
      gold: loyalties.filter(l => l.currentLevel === 'GOLD').length,
      platinum: loyalties.filter(l => l.currentLevel === 'PLATINUM').length,
      totalPoints: loyalties.reduce((sum, l) => sum + (l.totalPoints || 0), 0)
    };

    res.render('admin/pages/loyalty/index', {
      title: 'Quản lý Loyalty',
      loyalties: loyaltiesWithUsers,
      stats
    });
  } catch (error) {
    console.log(error);
    res.redirect('back');
  }
};

// [POST] /admin/loyalty/add-points - Thêm điểm cho user
module.exports.addPoints = async (req, res) => {
  try {
    const { userId, points, description } = req.body;
    const pointsNum = parseInt(points);

    let loyalty = await LoyaltyPoint.findOne({ userId });
    if (!loyalty) {
      loyalty = new LoyaltyPoint({ userId, totalPoints: 0 });
    }

    loyalty.totalPoints += pointsNum;
    loyalty.transactions.push({
      type: 'admin_bonus',
      points: pointsNum,
      description: description || `Admin cộng ${pointsNum} điểm`,
      createdAt: new Date()
    });

    // Update tier
    let newTier = 'BRONZE';
    if (loyalty.totalPoints >= 500) newTier = 'PLATINUM';
    else if (loyalty.totalPoints >= 300) newTier = 'GOLD';
    else if (loyalty.totalPoints >= 100) newTier = 'SILVER';
    loyalty.currentLevel = newTier;

    await loyalty.save();

    req.flash('success', `Đã cộng ${pointsNum} điểm cho user thành công!`);
    res.redirect('back');
  } catch (error) {
    console.log(error);
    req.flash('error', 'Lỗi khi cộng điểm!');
    res.redirect('back');
  }
};

// [POST] /admin/loyalty/deduct-points - Trừ điểm cho user
module.exports.deductPoints = async (req, res) => {
  try {
    const { userId, points, description } = req.body;
    const pointsNum = parseInt(points);

    const loyalty = await LoyaltyPoint.findOne({ userId });
    if (!loyalty) {
      req.flash('error', 'Không tìm thấy loyalty record!');
      return res.redirect('back');
    }

    if (loyalty.totalPoints < pointsNum) {
      req.flash('error', 'Điểm không đủ để trừ!');
      return res.redirect('back');
    }

    loyalty.totalPoints -= pointsNum;
    loyalty.transactions.push({
      type: 'admin_bonus',
      points: -pointsNum,
      description: description || `Admin trừ ${pointsNum} điểm`,
      createdAt: new Date()
    });

    // Update tier
    let newTier = 'BRONZE';
    if (loyalty.totalPoints >= 500) newTier = 'PLATINUM';
    else if (loyalty.totalPoints >= 300) newTier = 'GOLD';
    else if (loyalty.totalPoints >= 100) newTier = 'SILVER';
    loyalty.currentLevel = newTier;

    await loyalty.save();
    req.flash('success', `Đã trừ ${pointsNum} điểm thành công!`);
    res.redirect('back');
  } catch (error) {
    console.log(error);
    req.flash('error', 'Lỗi khi trừ điểm!');
    res.redirect('back');
  }
};
