const Message = require('../model/message.model');

// Create a new message
async function createMessage(sender, receiver, content) {
  try {
    const message = new Message({ sender, receiver, content });
    await message.save();
    return message;
  } catch (err) {
    throw err;
  }
}


async function getMessages(req, res) {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $and: [
        {
          $or: [
            { receiver: userId },
            { sender: userId }
          ]
        },
        { status: { $ne: 'closed' } }
      ]
    });
    return res.status(200).json(messages);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

// Thêm content mới vào ticket
async function addContentToTicket(ticketId, fromId, newContent) {
  try {
    const savecontent = fromId + ': ' + newContent; 
    const ticket = await Message.findByIdAndUpdate(
      ticketId,
      { $push: { content: savecontent } },
      { new: true }
    );
    return ticket;
  } catch (err) {
    throw err;
  }
}

// Lấy ticket (message) dựa trên ticketId
async function getTicketById(req) {
  try {
    const { ticketId } = req.params;
    const ticket = await Message.findById(ticketId);
    return ticket;
  } catch (err) {
    throw err;
  }
}

// Lấy content của ticket (message) dựa trên ticketId
async function getTicketContent(req,res) {
  try {
    const { ticketId } = req.params;
    const ticket = await Message.findById(ticketId);
    return ticket ? ticket.content : null;
  } catch (err) {
    throw err;
  }
}

// Đóng ticket bằng cách set status thành 'closed'
async function closeTicketStatus(ticketId) {
  try {
    const ticket = await Message.findByIdAndUpdate(
      ticketId,
      { status: 'closed' },
      { new: true }
    );
    return ticket;
  } catch (err) {
    throw err;
  }
}

// Lấy text content dựa trên messageId
async function getTextContentByMessageId(messageId) {
  try {
    const message = await Message.findById(messageId);
    return message ? message.content : null;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  createMessage,
  getMessages,
  addContentToTicket,
  getTicketById, // thêm hàm mới vào exports
  getTicketContent, // thêm hàm mới vào exports
  closeTicketStatus, // thêm function mới
  getTextContentByMessageId, // thêm function mới vào exports
  // Xóa ticket (message) theo id
  closeTicket: async function (ticketId) {
    try {
      const deleted = await Message.findByIdAndDelete(ticketId);
      return deleted;
    } catch (err) {
      throw err;
    }
  }
};