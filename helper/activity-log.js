const ActivityLog = require('../models/activity-log.model');

/**
 * Log an administrative activity
 * @param {Object} req - Express request object (to extract user and IP)
 * @param {String} action - Action type: CREATE, UPDATE, DELETE, LOGIN, LOGOUT
 * @param {String} targetType - The type of resource: PRODUCT, CATEGORY, etc.
 * @param {String|ObjectId} targetId - ID of the resource affected (optional)
 * @param {String} details - Human-readable details
 */
module.exports.log = async (req, action, targetType, targetId = null, details = '', overrideAccountId = null) => {
  try {
    let accountId = overrideAccountId;

    if (!accountId) {
      if (!req.cookies || !req.cookies.token) {
        return;
      }
      const account = req.res && req.res.locals && req.res.locals.user;
      // Also fallback to account from res.locals.account since sometimes it's stored there
      const altAccount = req.res && req.res.locals && req.res.locals.account;
      if (account) {
        accountId = account._id;
      } else if (altAccount) {
        accountId = altAccount._id || altAccount.id;
      }
    }
    
    if (!accountId) return;

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const newLog = new ActivityLog({
      accountId: accountId,
      action,
      targetType,
      targetId,
      details,
      ipAddress
    });

    await newLog.save();
  } catch (error) {
    console.error('Error saving activity log:', error);
  }
};
