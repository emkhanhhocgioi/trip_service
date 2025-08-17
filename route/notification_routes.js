const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  deleteNotification
} = require('../controller/notification_controller');

// Lấy danh sách thông báo của user
router.get('/:userId', async (req, res) => {
  try {
    const notifications = await getNotifications(req, res);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Đánh dấu đã đọc
router.patch('/read/:notificationId', markAsRead);

// Xóa thông báo
router.delete('/:notificationId', deleteNotification);

module.exports = router;