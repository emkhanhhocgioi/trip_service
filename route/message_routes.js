const express = require('express');
const router = express.Router();
const { getMessages ,getTicketById,getTicketContent} = require('../controller/message_controller');

// Route để lấy messages theo userId
router.get('/messages/:userId', getMessages);
router.get('/ticket/:ticketId', getTicketById);
router.get('/ticket/:ticketId/content', getTicketContent);

module.exports = router;

