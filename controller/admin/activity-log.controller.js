const ActivityLog = require('../../models/activity-log.model');
const systemConfig = require('../../config/system');

// [GET] /admin/activity-logs
module.exports.index = async (req, res) => {
  try {
    let find = {};
    if (req.query.action) {
      find.action = req.query.action;
    }
    if (req.query.targetType) {
      find.targetType = req.query.targetType;
    }

    const logs = await ActivityLog.find(find)
      .populate('accountId', 'fullname email avatar')
      .sort({ createdAt: 'desc' })
      .limit(100);

    res.render('admin/pages/activity-logs/index', {
      title: 'Nhật ký hoạt động',
      logs: logs
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    req.flash('error', 'Lỗi truy xuất nhật ký hoạt động');
    res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
  }
};
