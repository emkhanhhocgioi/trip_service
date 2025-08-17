const WebSocket = require('ws');
const clients = new Map();
const {createNotification} = require('../controller/notification_controller');
const {createMessage, addContentToTicket, closeTicketStatus} = require('../controller/message_controller');

const onConnection = (ws, req) => {
    ws.on('message', async (data) => {
        const message = JSON.parse(data);

        if (message.type === 'init') {
            const id = message.id;
            clients.set(id, ws);
            console.log(`New connection from: ${id}`);
            return;
        }

       
        if (message.type === 'notification') {
            const {userId, fromId, content} = message.data;
            console.log(`Received notification from ${fromId} to ${userId}: ${content}`);


        

            // Create notification in the database
           const res = await createNotification(userId, fromId, content);
           console.log('Notification created:', res);
            // Send notification to the user
            if (res && clients.has(fromId)) {
                clients.get(fromId).send(JSON.stringify({
                    type: 'notification',
                    from: userId,
                    message: content
                }));
            }
        }

        if(message.type === 'accept_order') {
             const {userId, fromId, content} = message.data;
            console.log(`Received notification from ${fromId} to ${userId}: ${content}`);
            
            // Create notification in the database
           const res = await createNotification(userId, fromId, content);
           console.log('Notification created:', res);
            // Send notification to the user
            if (res && clients.has(fromId)) {
                clients.get(fromId).send(JSON.stringify({
                    type: 'notification',
                    from: userId,
                    message: content
                }));
            }
        }

        if(message.type === 'create_support_ticket') {
            const {toId, fromId, content} = message.data;
            console.log(`Creating support ticket from ${fromId} to ${toId}: ${content}`);

            try {
                // Tạo ticket mới sử dụng message model
                const newTicket = await createMessage(fromId, toId, [content]);
                console.log('Support ticket created:', newTicket);
                
                // Send ticket information to both users
                if (clients.has(fromId)) {
                    clients.get(fromId).send(JSON.stringify({
                        type: 'ticket_created',
                        ticketId: newTicket._id,
                        message: 'Support ticket created successfully'
                    }));
                }
                
                if (clients.has(toId)) {
                    clients.get(toId).send(JSON.stringify({
                        type: 'new_support_ticket',
                        ticketId: newTicket._id,
                        from: fromId,
                        content: content
                    }));
                }
            } catch (error) {
                console.error('Error creating support ticket:', error);
            }
        }
        if(message.type === 'get_support_message') {
            const { userId } = message.data;
            console.log(`Getting messages for user: ${userId}`);
            
            try {
                // Tạo req object giả lập để gọi getMessages
                const req = { params: { userId } };
                
                // Tạo res object để handle response
                const res = {
                    status: function(code) {
                        this.statusCode = code;
                        return this;
                    },
                    json: function(data) {
                        // Gửi messages về client qua websocket
                        if (clients.has(userId)) {
                            clients.get(userId).send(JSON.stringify({
                                type: 'messages_response',
                                data: data,
                                success: true
                            }));
                        }
                        return this;
                    }
                };
                
                // Gọi hàm getMessages
                const { getMessages } = require('./message_controller');
                await getMessages(req, res);
                
            } catch (error) {
                console.error('Error getting messages:', error);
                // Gửi error về client
                if (clients.has(userId)) {
                    clients.get(userId).send(JSON.stringify({
                        type: 'messages_response',
                        error: error.message || 'Internal server error',
                        success: false
                    }));
                }
            }
        }

        if(message.type === 'support_message') {
            const {fromId, toId, content, ticketId} = message.data;
            console.log(`Received support message from ${fromId} to ${toId}: ${content}, ticketId: ${ticketId}`);

            try {
                // Thêm content mới vào ticket hiện có
                let updatedTicket = null;
                if (ticketId) {
                    updatedTicket = await addContentToTicket(ticketId, fromId, content);
                    console.log('Content added to ticket:', updatedTicket);
                }

                // Send message với content mới từ ticket đã được cập nhật tới toId
                if (clients.has(toId)) {
                    clients.get(toId).send(JSON.stringify({
                        type: 'support_message',
                        from: fromId,
                        message: content,
                        ticketId: ticketId,
                        updatedContent: updatedTicket ? updatedTicket.content : null
                    }));
                }
                
                // Send confirmation to sender với content mới
                if (clients.has(fromId)) {
                    clients.get(fromId).send(JSON.stringify({
                        type: 'message_sent',
                        ticketId: ticketId,
                        message: 'Message sent successfully',
                        updatedContent: updatedTicket ? updatedTicket.content : null
                    }));
                }
            } catch (error) {
                console.error('Error handling support message:', error);
            }
        }

        if(message.type === 'close_ticket') {
            const {ticketId, fromId, toId} = message.data;
            console.log(`Closing ticket ${ticketId} by user ${fromId}`);

            try {
                // Đóng ticket bằng cách set status thành 'closed'
                const closedTicket = await closeTicketStatus(ticketId);
                
                if (closedTicket) {
                    console.log('Ticket closed successfully:', closedTicket);
                    
                    // Gửi thông báo đóng ticket cho người đóng
                    if (clients.has(fromId)) {
                        clients.get(fromId).send(JSON.stringify({
                            type: 'ticket_closed',
                            ticketId: ticketId,
                            message: 'Ticket closed successfully',
                            status: 'closed'
                        }));
                    }
                    
                    // Gửi thông báo đóng ticket cho người còn lại (nếu có)
                    if (toId && clients.has(toId)) {
                        clients.get(toId).send(JSON.stringify({
                            type: 'ticket_closed_by_other',
                            ticketId: ticketId,
                            closedBy: fromId,
                            message: 'Ticket has been closed',
                            status: 'closed'
                        }));
                    }
                } else {
                    // Ticket không tồn tại
                    if (clients.has(fromId)) {
                        clients.get(fromId).send(JSON.stringify({
                            type: 'ticket_close_error',
                            ticketId: ticketId,
                            error: 'Ticket not found'
                        }));
                    }
                }
            } catch (error) {
                console.error('Error closing ticket:', error);
                
                // Gửi lỗi về client
                if (clients.has(fromId)) {
                    clients.get(fromId).send(JSON.stringify({
                        type: 'ticket_close_error',
                        ticketId: ticketId,
                        error: error.message || 'Failed to close ticket'
                    }));
                }
            }
        }

    });

    ws.on('close', () => {
        for (const [userId, socket] of clients.entries()) {
            if (socket === ws) {
                clients.delete(userId);
                break;
            }
        }
    });

    ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to WebSocket Server',
        online: clients.size
    }));
};



module.exports = { onConnection,};