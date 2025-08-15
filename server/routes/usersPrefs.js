// server/routes/usersPrefs.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');

router.use(auth);

// GET /api/users/me/preferences
router.get('/me/preferences', async (req, res, next) => {
  try {
    const me = await User.findById(req.user.id).select('defaultReminderMinutes');
    if (!me) return res.status(404).json({ message: 'User not found' });
    return res.json({ defaultReminderMinutes: me.defaultReminderMinutes ?? 15 });
  } catch (e) { next(e); }
});

// PUT /api/users/me/preferences
router.put('/me/preferences', async (req, res, next) => {
  try {
    const { defaultReminderMinutes } = req.body || {};
    const minutes = Number(defaultReminderMinutes);
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 1440) {
      return res.status(400).json({ message: 'defaultReminderMinutes must be 0–1440' });
    }
    const me = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { defaultReminderMinutes: minutes } },
      { new: true, select: 'defaultReminderMinutes' }
    );
    if (!me) return res.status(404).json({ message: 'User not found' });
    return res.json({ defaultReminderMinutes: me.defaultReminderMinutes });
  } catch (e) { next(e); }
});

module.exports = router;
