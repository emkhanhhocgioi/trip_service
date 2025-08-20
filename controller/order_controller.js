const Order = require('../model/order_model');
const Route = require('../model/trip_model').Route || require('../model/trip_model');
const Partner = require('../model/user_partner');
const {createPDfticket} = require('./trip_controller');
const Trip =  require('../model/trip_model');
const {mintTicket, getTicket, getBalance, getTicketOwner, cancelTicket, updateTicketStatus} = require('../service/contract_connect');
const axios = require('axios');
const vnpayService = require('../utils/vnpay');
const { getClientIPAddress } = require('../utils/ip-utils');
const mongoose = require('mongoose');

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "hidrabula@gmail.com",
    pass: "dgkg ruas hkqd nxmn",
  },
});

// Function to send ticket email
const sendTicketEmail = async (order, ticketInfo) => {
  try {
    const mailOptions = {
      from: "hidrabula@gmail.com",
      to: order.email,
      subject: "🎫 Your Bus Ticket - Order Confirmed",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #2563EB, #1D4ED8); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .ticket-info { background-color: #f8fafc; border-left: 4px solid #2563EB; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .label { font-weight: bold; color: #374151; }
            .value { color: #6b7280; word-break: break-all; }
            .download-btn { display: inline-block; background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; font-weight: bold; }
            .download-btn:hover { background-color: #1D4ED8; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚌 Bus Ticket Confirmed</h1>
              <p>Your order has been accepted and your ticket is ready!</p>
            </div>
            
            <div class="content">
              <h2>Hello ${order.fullName},</h2>
              <p>Great news! Your bus ticket order has been confirmed. Here are your ticket details:</p>
              
              <div class="ticket-info">
                <h3>🎫 Ticket Information</h3>
                <div class="info-row">
                  <span class="label">Ticket ID:</span>
                  <span class="value">${ticketInfo.ticketId}</span>
                </div>
                <div class="info-row">
                  <span class="label">NFT Token ID:</span>
                  <span class="value">${ticketInfo.nftTicketId || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Contract Address:</span>
                  <span class="value">${ticketInfo.contractAddress || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Transaction Hash:</span>
                  <span class="value">${ticketInfo.blockchainTxHash || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="label">PDF Hash (IPFS):</span>
                  <span class="value">${ticketInfo.ipfsHash || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Metadata Hash (IPFS):</span>
                  <span class="value">${ticketInfo.metadataHash || 'N/A'}</span>
                </div>
              </div>

              <h3>📱 Download Your Ticket</h3>
              <p>Click the buttons below to access your ticket:</p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${ticketInfo.downloadUrl}" class="download-btn">📄 Download PDF Ticket</a>
                <a href="${ticketInfo.metadataUrl}" class="download-btn">📋 View Metadata</a>
              </div>

              <div class="ticket-info">
                <h3>🚌 Journey Details</h3>
                <div class="info-row">
                  <span class="label">Passenger:</span>
                  <span class="value">${order.fullName}</span>
                </div>
                <div class="info-row">
                  <span class="label">Phone:</span>
                  <span class="value">${order.phone}</span>
                </div>
                <div class="info-row">
                  <span class="label">Email:</span>
                  <span class="value">${order.email}</span>
                </div>
                <div class="info-row">
                  <span class="label">Order Total:</span>
                  <span class="value">${order.total.toLocaleString('vi-VN')} VND</span>
                </div>
              </div>

              <h3>⚠️ Important Notes:</h3>
              <ul>
                <li>Please arrive at the departure point 15 minutes early</li>
                <li>Keep this ticket for the entire journey</li>
                <li>This ticket is stored on the blockchain as an NFT for authenticity</li>
                <li>Contact support if you have any issues: 1900-xxxx</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing our bus service!</p>
              <p>Safe travels and have a wonderful journey.</p>
              <p><small>This is an automated email. Please do not reply.</small></p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Ticket email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending ticket email:', error);
    return { success: false, error: error.message };
  }
};


// Create payment URL for VNPay
const createPayment = async (req, res) => {
  try {
    const {
      orderId,
      amount,
      orderInfo,
      bankCode,
      locale = 'vn'
    } = req.body;

    // Validate required fields
    if (!orderId || !amount) {
      console.log('Missing required fields:', { orderId, amount });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: orderId and amount are required'
      });
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is confirmed and can be paid
    if (order.orderStatus !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot create payment for order with status: ${order.orderStatus}`
      });
    }

    // Validate amount matches order total
    if (amount !== order.total) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount does not match order total'
      });
    }

    // Get client IP address
    const clientIP = getClientIPAddress(req);

    // Prepare payment parameters
    const paymentParams = {
      orderId: orderId,
      amount: amount,
      orderInfo: orderInfo || `Thanh toan ve xe cho don hang ${orderId}`,
      ipAddr: clientIP,
      locale: locale
    };

    // Add bank code if provided
    if (bankCode) {
      paymentParams.bankCode = bankCode;
    }

    // Create payment URL
    const paymentUrl = vnpayService.createPaymentUrl(paymentParams);

    // Update order with payment attempt timestamp
    await Order.findByIdAndUpdate(orderId, {
      paymentAttemptAt: new Date()
    });

    // Return payment URL
    res.status(200).json({
      success: true,
      message: 'Payment URL created successfully',
      data: {
        paymentUrl: paymentUrl,
        orderId: orderId,
        amount: amount,
        orderInfo: paymentParams.orderInfo,
        clientIP: clientIP
      }
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Handle VNPay return callback
const handlePaymentReturn = async (req, res) => {
  try {
    const vnpParams = req.query;

    // Verify the return request
    const isValid = vnpayService.verifyReturnUrl(vnpParams);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment verification signature'
      });
    }

    const {
      vnp_TxnRef: orderId,
      vnp_Amount: amount,
      vnp_ResponseCode: responseCode,
      vnp_TransactionNo: transactionNo,
      vnp_BankCode: bankCode,
      vnp_PayDate: payDate
    } = vnpParams;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if payment was successful
    if (responseCode === '00') {
      // Payment successful
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          orderStatus: 'paid',
          paymentStatus: 'completed',
          paymentMethod: 'vnpay',
          transactionNo: transactionNo,
          bankCode: bankCode,
          paymentDate: new Date(payDate ? payDate.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6') : Date.now())
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: 'Payment completed successfully',
        data: {
          orderId: updatedOrder._id,
          orderStatus: updatedOrder.orderStatus,
          paymentStatus: updatedOrder.paymentStatus,
          transactionNo: transactionNo,
          amount: amount / 100, // Convert back from VNPay format
          responseMessage: vnpayService.getResponseMessage(responseCode)
        }
      });
    } else {
      // Payment failed
      await Order.findByIdAndUpdate(
        orderId,
        {
          paymentStatus: 'failed',
          paymentFailureReason: vnpayService.getResponseMessage(responseCode)
        }
      );

      res.status(400).json({
        success: false,
        message: 'Payment failed',
        data: {
          orderId: orderId,
          responseCode: responseCode,
          responseMessage: vnpayService.getResponseMessage(responseCode)
        }
      });
    }

  } catch (error) {
    console.error('Error handling payment return:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while processing payment return',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create a new order
const createOrder = async (req, res) => {
  try {
    const {
      routeId,
      userId,
      bussinessId,
      fullName,
      phone,
      email,
      dateOfBirth,
      gender,
      paymentMethod,
      basePrice,
      fees
    } = req.body;

    // Validate required fields
    if (!routeId || !userId || !fullName || !phone || !email || !paymentMethod || !basePrice) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if route exists
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }



    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate payment method
    const validPaymentMethods = ['vnpay', 'credit_card', 'bank_transfer', 'e_wallet', 'cash'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Must be one of: vnpay, credit_card, bank_transfer, e_wallet, cash'
      });
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // Calculate total price
    const calculatedFees = fees || 0;
    const total = basePrice + calculatedFees;

    // Create new order
    const newOrder = new Order({
      routeId,
      userId,
      bussinessId,
      fullName: fullName.trim(),
      phone,
      email: email.toLowerCase(),
      dateOfBirth: dateOfBirth || '',
      gender: gender || 'male',
      paymentMethod,
      basePrice,
      fees: calculatedFees,
      total,
      orderStatus: 'pending'
    });

    // Save the order
    const savedOrder = await newOrder.save();

    // Update route with new booking and recalculate available seats
    await Route.findByIdAndUpdate(
      routeId,
      { 
        $push: { 
          bookedSeats: {
            orderId: savedOrder._id,
            seatNumber: savedOrder.seatNumber || null,
            bookedAt: new Date()
          }
        },
        $inc: { availableSeats: -1 }
      }
    );

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: savedOrder._id,
        routeId: savedOrder.routeId,
        userId: savedOrder.userId,
        bussinessId: savedOrder.bussinessId,
        fullName: savedOrder.fullName,
        phone: savedOrder.phone,
        email: savedOrder.email,
        paymentMethod: savedOrder.paymentMethod,
        total: savedOrder.total,
        orderStatus: savedOrder.orderStatus,
        createdAt: savedOrder.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate data found'
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Accept an order
const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate orderId
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is in pending status
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept order. Current status: ${order.orderStatus}`
      });
    }

    // Update order status to confirmed
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: 'confirmed' },
      { new: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or could not be updated'
      });
    }

    // Create PDF ticket after accepting order
    try {
      const ticketResult = await createPDfticket(
        updatedOrder._id  // Pass orderId instead of individual parameters
      );
      
      console.log('Ticket creation result:', ticketResult);
      
      // Send email with ticket information if ticket was created successfully
      if (ticketResult.status === 200 && ticketResult.ticketInfo) {
        try {
          const emailResult = await sendTicketEmail(updatedOrder, ticketResult.ticketInfo);
          console.log('Email sending result:', emailResult);
        } catch (emailError) {
          console.error('Error sending ticket email:', emailError);
          // Don't fail the whole process if email fails
        }
      }
      
      // Return success response with ticket info including blockchain data
      res.status(200).json({
        success: true,
        message: 'Order accepted and ticket created successfully',
        data: {
          orderId: updatedOrder._id,
          orderStatus: updatedOrder.orderStatus,
          fullName: updatedOrder.fullName,
          total: updatedOrder.total,
          email: updatedOrder.email,
          ticket: ticketResult.status === 200 ? {
            ...ticketResult.ticketInfo,
            contractAddress: ticketResult.ticketInfo.contractAddress,
            blockchainTxHash: ticketResult.ticketInfo.blockchainTxHash
          } : null
        }
      });
    } catch (ticketError) {
      console.error('Error creating ticket:', ticketError);
      
      // Order was accepted but ticket creation failed
      res.status(200).json({
        success: true,
        message: 'Order accepted successfully, but ticket creation failed',
        data: {
          orderId: updatedOrder._id,
          orderStatus: updatedOrder.orderStatus,
          fullName: updatedOrder.fullName,
          total: updatedOrder.total
        },
        warning: 'Ticket creation failed - please contact support'
      });
    }

  } catch (error) {
    console.error('Error accepting order:', error);
    
    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Decline an order
const declineOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate orderId
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is in pending status
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot decline order. Current status: ${order.orderStatus}`
      });
    }

    // Update order status to cancelled and restore seat availability
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: 'cancelled' },
      { new: true }
    );

    // Restore available seats in route
    await Route.findByIdAndUpdate(
      order.routeId,
      { $inc: { availableSeats: 1 } }
    );

    res.status(200).json({
      success: true,
      message: 'Order declined successfully',
      data: {
        orderId: updatedOrder._id,
        orderStatus: updatedOrder.orderStatus,
        fullName: updatedOrder.fullName,
        total: updatedOrder.total
      }
    });

  } catch (error) {
    console.error('Error declining order:', error);
    
    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};




const getOrdersByrouteId = async (req, res) => {
  try {
    const { routeId } = req.params;

    // Validate routeId
    if (!routeId) {
      return res.status(400).json({
        success: false,
        message: 'Route ID is required'
      });
    }

    // Find orders by routeId
    const orders = await Order.find({ routeId });

    if (orders.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No orders found for this route',
        data: []
      });
    }

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders
    });

  } catch (error) {
    console.error('Error fetching orders by route ID:', error);
  }
};

const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Find orders by userId and populate route and partner information
    const orders = await Order.find({ userId })
      .populate({
        path: 'routeId',
        select: 'busType duration departureTime from to price routeCode'
      })
      .populate({
        path: 'bussinessId',
        select: 'phone company email'
      });

    if (orders.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No orders found for this user',
        data: []
      });
    }

    const ordersWithContactAndRoute = orders.map(order => {
      // Extract partner contact information
      const partnerInfo = order.bussinessId ? {
        phone: order.bussinessId.phone || '',
        company: order.bussinessId.company || '',
        email: order.bussinessId.email || ''
      } : {
        phone: '',
        company: '',
        email: ''
      };
      
      // Extract route information
      const routeInfo = order.routeId ? {
        busType: order.routeId.busType,
        duration: order.routeId.duration,
        departureTime: order.routeId.departureTime,
        from: order.routeId.from,
        to: order.routeId.to,
        price: order.routeId.price,
        routeCode: order.routeId.routeCode
      } : {};

      return {
        ...order.toObject(),
        phone: partnerInfo.phone,
        company: partnerInfo.company,
        partnerEmail: partnerInfo.email,
        routeInfo
      };
    });

    res.status(200).json({
      success: true,
      message: 'User orders retrieved successfully',
      data: ordersWithContactAndRoute
    });

  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get orders by phone number (supports partial matching)
const getOrdersByPhoneNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.params;

  
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }


    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    
    const cleanPhoneNumber = phoneNumber.replace(/[^\d]/g, '');
    const phonePattern = new RegExp(cleanPhoneNumber.split('').join('.*'), 'i');

    
    const orders = await Order.find({ 
      phone: { $regex: phonePattern }
    })
    .populate({
      path: 'routeId',
      select: 'busType duration departureTime from to price routeCode'
    })
    .populate({
      path: 'bussinessId',
      select: 'phone company email'
    });

    if (orders.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No orders found for this phone number',
        data: []
      });
    }

    // Get partner contact information for each order
    const ordersWithContactAndRoute = orders.map(order => {
      // Extract partner contact information
      const partnerInfo = order.bussinessId ? {
        phone: order.bussinessId.phone || '',
        company: order.bussinessId.company || '',
        email: order.bussinessId.email || ''
      } : {
        phone: '',
        company: '',
        email: ''
      };
      
      // Extract route information
      const routeInfo = order.routeId ? {
        busType: order.routeId.busType,
        duration: order.routeId.duration,
        departureTime: order.routeId.departureTime,
        from: order.routeId.from,
        to: order.routeId.to,
        price: order.routeId.price,
        routeCode: order.routeId.routeCode
      } : {};

      return {
        ...order.toObject(),
        partnerPhone: partnerInfo.phone,
        company: partnerInfo.company,
        partnerEmail: partnerInfo.email,
        routeInfo
      };
    });

    res.status(200).json({
      data: ordersWithContactAndRoute
    });

  } catch (error) {
    console.error('Error fetching orders by phone number:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get popular routes based on order count
const getPopularRoutes = async (req, res) => {
  try {
    const { limit = 4 } = req.query; // Default limit to 4 routes
    const limitNumber = parseInt(limit);

    // Validate limit parameter
    if (isNaN(limitNumber) || limitNumber <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be a positive number'
      });
    }

    // Aggregate orders by routeId to count popularity
    const popularRoutes = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: 'cancelled' } // Exclude cancelled orders
        }
      },
      {
        $group: {
          _id: '$routeId',
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' }
        }
      },
      {
        $sort: { orderCount: -1 } // Sort by order count descending
      },
      {
        $limit: limitNumber
      },
      {
        $lookup: {
          from: 'routes', // Collection name for Route model
          localField: '_id',
          foreignField: '_id',
          as: 'routeDetails'
        }
      },
      {
        $unwind: '$routeDetails'
      },
      {
        $lookup: {
          from: 'partners', // Collection name for Partner model
          localField: 'routeDetails.partnerId',
          foreignField: '_id',
          as: 'partnerDetails'
        }
      },
      {
        $unwind: '$partnerDetails'
      },
      {
        $project: {
          _id: 1,
          orderCount: 1,
          totalRevenue: 1,
          avgOrderValue: { $round: ['$avgOrderValue', 2] },
          routeCode: '$routeDetails.routeCode',
          from: '$routeDetails.from',
          to: '$routeDetails.to',
          departureTime: '$routeDetails.departureTime',
          duration: '$routeDetails.duration',
          price: '$routeDetails.price',
          busType: '$routeDetails.busType',
          licensePlate: '$routeDetails.licensePlate',
          rating: '$routeDetails.rating',
          partnerId: '$routeDetails.partnerId',
          isActive: '$routeDetails.isActive',
          images: '$routeDetails.images',
          partnerInfo: {
            _id: '$partnerDetails._id',
            company: '$partnerDetails.company',
            phone: '$partnerDetails.phone',
            email: '$partnerDetails.email'
          }
        }
      }
    ]);

    if (popularRoutes.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No popular routes found',
        data: []
      });
    }

    res.status(200).json({
      success: true,
      message: 'Popular routes retrieved successfully',
      data: popularRoutes,
      total: popularRoutes.length
    });

  } catch (error) {
    console.error('Error fetching popular routes:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


const checkoutRouteOrder = async (req, res) => {  
  try {
    const { routeId } = req.params;

    // Validate routeId
    if (!routeId) {
      return res.status(400).json({
        success: false,
        message: 'Route ID is required'
      });
    }

    // Check if route exists
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // Find all orders for this route that are not cancelled
    const orders = await Order.find({ 
      routeId: routeId,
      orderStatus: { $in: ['confirmed', 'paid'] }
    });

    if (orders.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No orders found to checkout for this route',
        data: {
          routeId: routeId,
          updatedOrdersCount: 0
        }
      });
    }

    // Update all eligible orders to 'finished' status
    const updateResult = await Order.updateMany(
      { 
        routeId: routeId,
        orderStatus: { $in: ['confirmed', 'paid'] }
      },
      { 
        orderStatus: 'finished',
        finishedAt: new Date()
      }
    );

    // Reset available seats and clear booked seats array for the route
    await Route.findByIdAndUpdate(
      routeId,
      { 
        availableSeats: route.totalSeats, // Reset to total seats
        bookedSeats: [] // Clear all booked seats
      }
    );

    // Get the updated orders to return in response
    const updatedOrders = await Order.find({ 
      routeId: routeId,
      orderStatus: 'finished'
    }).select('_id fullName phone email orderStatus finishedAt');

    res.status(200).json({
      success: true,
      message: `Successfully checked out ${updateResult.modifiedCount} orders for route and reset seat availability`,
      data: {
        routeId: routeId,
        routeCode: route.routeCode,
        from: route.from,
        to: route.to,
        departureTime: route.departureTime,
        updatedOrdersCount: updateResult.modifiedCount,
        finishedOrders: updatedOrders,
        resetSeats: {
          totalSeats: route.totalSeats,
          availableSeats: route.totalSeats,
          bookedSeatsCleared: route.bookedSeats.length
        }
      }
    });

  } catch (error) {
    console.error('Error checking out route orders:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while checking out route orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

const getOrderbyID = async (req, res) => {  
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Validate if orderId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Order ID format'
      });
    }

    const response = await Order.findById(orderId).populate({
      path: 'routeId',
      select: 'busType duration departureTime from to price routeCode'
    });
    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Order retrieved successfully',
      data: response
    });

  } catch (error) {
    console.error('Error retrieving order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


// Create QR payment for VNPay
const createQRPayment = async (req, res) => {
  try {
    const {
      orderId,
      amount,
      orderInfo,
      bankCode,
      locale = 'vn',
      expiryMinutes = 15
    } = req.body;

    // Validate required fields
    if (!orderId || !amount) {
      console.log('Missing required fields for QR payment:', { orderId, amount });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: orderId and amount are required'
      });
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    // Validate expiry minutes
    if (expiryMinutes < 5 || expiryMinutes > 60) {
      return res.status(400).json({
        success: false,
        message: 'Expiry minutes must be between 5 and 60 minutes'
      });
    }

    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is pending and can be paid
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot create QR payment for order with status: ${order.orderStatus}`
      });
    }

    // Validate amount matches order total
    if (amount !== order.total) {
      return res.status(400).json({
        success: false,
        message: `Amount mismatch. Expected: ${order.total}, Received: ${amount}`
      });
    }

    // Get client IP address
    const clientIP = getClientIPAddress(req);

    // Prepare QR payment parameters
    const qrPaymentParams = {
      orderId: orderId,
      amount: amount,
      orderInfo: orderInfo || `Thanh toan QR ve xe cho don hang ${orderId}`,
      ipAddr: clientIP,
      locale: locale,
      expiryMinutes: expiryMinutes
    };

    // Add bank code if provided
    if (bankCode) {
      qrPaymentParams.bankCode = bankCode;
    }

    // Create QR payment data
    const qrPaymentData = vnpayService.createQRPayment(qrPaymentParams);

    // Update order with QR payment attempt timestamp
    await Order.findByIdAndUpdate(orderId, {
      qrPaymentAttemptAt: new Date(),
      qrExpiryTime: new Date(Date.now() + expiryMinutes * 60000)
    });

    // Return QR payment data
    res.status(200).json({
      success: true,
      message: 'QR payment created successfully',
      data: {
        orderId: orderId,
        amount: amount,
        orderInfo: qrPaymentParams.orderInfo,
        clientIP: clientIP,
        expiryTime: qrPaymentData.expiryTime,
        qrString: qrPaymentData.qrString,
        paymentUrl: qrPaymentData.paymentUrl,
        expiryMinutes: expiryMinutes,
        createdAt: qrPaymentData.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating QR payment:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating QR payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Check QR payment status
const checkQRPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate orderId
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if QR payment was attempted
    if (!order.qrPaymentAttemptAt) {
      return res.status(400).json({
        success: false,
        message: 'No QR payment found for this order'
      });
    }

    // Check if QR payment has expired
    const now = new Date();
    if (order.qrExpiryTime && now > order.qrExpiryTime) {
      return res.status(400).json({
        success: false,
        message: 'QR payment has expired',
        data: {
          orderId: orderId,
          status: 'expired',
          expiryTime: order.qrExpiryTime,
          currentTime: now
        }
      });
    }

    // Check current order status
    let paymentStatus = 'pending';
    let message = 'QR payment is pending';

    switch (order.orderStatus) {
      case 'confirmed':
        paymentStatus = 'success';
        message = 'Payment completed successfully';
        break;
      case 'cancelled':
        paymentStatus = 'failed';
        message = 'Payment was cancelled';
        break;
      case 'pending':
        paymentStatus = 'pending';
        message = 'Payment is still pending';
        break;
      default:
        paymentStatus = 'unknown';
        message = `Order status: ${order.orderStatus}`;
    }

    // Use VNPay service to check status
    const vnpayStatus = await vnpayService.checkQRPaymentStatus(orderId);

    res.status(200).json({
      success: true,
      message: message,
      data: {
        orderId: orderId,
        paymentStatus: paymentStatus,
        orderStatus: order.orderStatus,
        amount: order.total,
        qrAttemptTime: order.qrPaymentAttemptAt,
        qrExpiryTime: order.qrExpiryTime,
        vnpayStatus: vnpayStatus,
        lastChecked: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error checking QR payment status:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while checking QR payment status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Handle QR payment verification (similar to handlePaymentReturn but for QR)
const verifyQRPayment = async (req, res) => {
  try {
    const vnpParams = req.query.vnp_Params ? JSON.parse(req.query.vnp_Params) : req.query;

    // Verify the QR payment request
    const isValid = vnpayService.verifyQRPayment(vnpParams);

    if (!isValid) {
      console.log('Invalid QR payment verification:', vnpParams);
      return res.status(400).json({
        success: false,
        message: 'Invalid QR payment verification'
      });
    }

    const {
      vnp_TxnRef: orderId,
      vnp_Amount: amount,
      vnp_ResponseCode: responseCode,
      vnp_TransactionNo: transactionNo,
      vnp_BankCode: bankCode,
      vnp_PayDate: payDate
    } = vnpParams;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if payment was successful
    if (responseCode === '00') {
      // Payment successful
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          orderStatus: 'confirmed',
          paymentMethod: 'vnpay_qr',
          vnpayTransactionNo: transactionNo,
          vnpayResponseCode: responseCode,
          vnpayBankCode: bankCode,
          vnpayPayDate: payDate,
          paidAt: new Date()
        },
        { new: true }
      );

      // Create PDF ticket after successful payment
      try {
        const ticketResult = await createPDfticket(updatedOrder._id);
        
        // Send email with ticket information if ticket was created successfully
        if (ticketResult && ticketResult.status === 200 && ticketResult.ticketInfo) {
          try {
            const emailResult = await sendTicketEmail(updatedOrder, ticketResult.ticketInfo);
            console.log('Email sending result after QR payment:', emailResult);
          } catch (emailError) {
            console.error('Error sending ticket email after QR payment:', emailError);
            // Don't fail the whole process if email fails
          }
        }
      } catch (ticketError) {
        console.error('Error creating PDF ticket after QR payment:', ticketError);
      }

      res.status(200).json({
        success: true,
        message: 'QR payment verified successfully',
        data: {
          orderId: updatedOrder._id,
          orderStatus: updatedOrder.orderStatus,
          transactionNo: transactionNo,
          amount: amount / 100, // Convert back from VND smallest unit
          paymentMethod: 'vnpay_qr',
          paidAt: updatedOrder.paidAt
        }
      });
    } else {
      // Payment failed
      await Order.findByIdAndUpdate(
        orderId,
        {
          orderStatus: 'cancelled',
          vnpayResponseCode: responseCode,
          vnpayTransactionNo: transactionNo,
          paymentFailedAt: new Date()
        }
      );

      // Restore available seats in route
      await Route.findByIdAndUpdate(
        order.routeId,
        { $inc: { availableSeats: 1 } }
      );

      res.status(400).json({
        success: false,
        message: `QR payment failed: ${vnpayService.getResponseMessage(responseCode)}`,
        data: {
          orderId: orderId,
          responseCode: responseCode,
          message: vnpayService.getResponseMessage(responseCode),
          transactionNo: transactionNo
        }
      });
    }

  } catch (error) {
    console.error('Error verifying QR payment:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while verifying QR payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};




// Set order status to prepaid
const setPrepaidStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate orderId
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is in confirmed status (can only set prepaid from confirmed)
    if (order.orderStatus !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot set prepaid status. Order must be in 'confirmed' status. Current status: ${order.orderStatus}`
      });
    }

    // Update order status to prepaid
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { 
        orderStatus: 'prepaid',
        paymentStatus: 'completed',
        paidAt: new Date()
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update order status'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order status set to prepaid successfully',
      data: {
        orderId: updatedOrder._id,
        orderStatus: updatedOrder.orderStatus,
        paymentStatus: updatedOrder.paymentStatus,
        fullName: updatedOrder.fullName,
        phone: updatedOrder.phone,
        total: updatedOrder.total,
        paidAt: updatedOrder.paidAt,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error setting prepaid status:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while setting prepaid status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// Test email function (for development purposes)
const testTicketEmail = async (req, res) => {
  try {
    const mockOrder = {
      fullName: "Test User",
      email: "test@example.com",
      phone: "0123456789",
      total: 250000
    };
    
    const mockTicketInfo = {
      ticketId: "TEST123456",
      nftTicketId: "789",
      contractAddress: "0x1234567890abcdef",
      blockchainTxHash: "0xabcdef1234567890",
      ipfsHash: "QmTestPDFHash123",
      metadataHash: "QmTestMetadataHash456",
      downloadUrl: "https://ipfs.io/ipfs/QmTestPDFHash123",
      metadataUrl: "https://ipfs.io/ipfs/QmTestMetadataHash456"
    };
    
    const result = await sendTicketEmail(mockOrder, mockTicketInfo);
    
    res.status(200).json({
      success: true,
      message: 'Test email sent',
      result: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Test email failed',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  acceptOrder,
  getOrderbyID,
  declineOrder,
  getUserOrders,
  getOrdersByrouteId,
  getOrdersByPhoneNumber,
  getPopularRoutes,
  createPayment,
  handlePaymentReturn,
  createQRPayment,
  checkQRPaymentStatus,
  verifyQRPayment,
  checkoutRouteOrder,
  setPrepaidStatus,
  testTicketEmail
};
