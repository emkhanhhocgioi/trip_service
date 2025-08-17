const notifications = require('../model/notification_model');


const createNotification = async (userId, fromId, message) => {
    const notification = new notifications({
        userId,
        fromId,
        message
    });
    await notification.save();
    return notification;
};

const getNotifications = async (req,res) => {
    const { userId } = req.params;
    const userNotifications = await notifications.find({ fromId:userId });
    return userNotifications;
};

const markAsRead = async (req, res) => {
    const { notificationId } = req.params;
    const notification = await notifications.findById(notificationId);
    if (!notification) {
        return res.status(404).send('Notification not found');
    }
    notification.read = true;
    await notification.save();
    return res.send(notification);
};

const deleteNotification = async (req, res) => {
    const { notificationId } = req.params;
    const notification = await notifications.findOneAndDelete({ _id: notificationId });
    if (!notification) {
        return res.status(404).send('Notification not found');
    }
    return res.send({ message: 'Notification deleted' });
};

module.exports = { createNotification , getNotifications , markAsRead , deleteNotification };