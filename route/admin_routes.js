const express = require('express');
const router = express.Router();
const adminController = require('../controller/admin_controller');
const { verifyAdminToken, checkPermission, requireSuperAdmin } = require('../middleware/admin_auth');


router.post('/login', adminController.adminLogin);

router.get('/verify', verifyAdminToken, adminController.verifyAdmin);

router.post('/create', verifyAdminToken, requireSuperAdmin, adminController.createAdmin);


router.get('/dashboard', adminController.getDashboardStats);


router.get('/users', adminController.getAllUsers);


router.get('/partners', adminController.getAllPartners);

router.patch('/partners/:partnerId/verify', 
  adminController.togglePartnerVerification
);


router.get('/orders', adminController.getAllOrders);


router.get('/reviews', adminController.getAllReviews);


router.patch('/reviews/:reviewId/approve', 
  adminController.toggleReviewApproval
);

// ===== ROUTE MANAGEMENT ROUTES =====
// Get all routes
router.get('/routes', adminController.getAllRoutes);

// Toggle route active status
router.patch('/routes/:routeId/status', 
  adminController.toggleRouteStatus
);

// ===== ADDITIONAL MANAGEMENT ROUTES =====

// Get specific user details
router.get('/users/:userId', async (req, res) => {
  try {
    const User = require('../model/user_account');
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('recentBookings');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server nội bộ'
    });
  }
});

// Get specific partner details
router.get('/partners/:partnerId', async (req, res) => {
  try {
    const Partner = require('../model/user_partner');
    const partner = await Partner.findById(req.params.partnerId).select('-password');
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đối tác'
      });
    }

    res.status(200).json({
      success: true,
      data: partner
    });
  } catch (error) {
    console.error('Get partner details error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server nội bộ'
    });
  }
});

// Get specific order details
router.get('/orders/:orderId', async (req, res) => {
  try {
    const Order = require('../model/order_model');
    const order = await Order.findById(req.params.orderId)
      .populate('userId', 'name email phone')
      .populate('routeId', 'from to departureTime price busType')
      .populate('bussinessId', 'company email phone');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server nội bộ'
    });
  }
});

// Update user status (activate/deactivate)
router.patch('/users/:userId/status', async (req, res) => {
  try {
    const User = require('../model/user_account');
    const { isVerified } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isVerified },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.status(200).json({
      success: true,
      message: `${isVerified ? 'Kích hoạt' : 'Vô hiệu hóa'} người dùng thành công`,
      data: user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server nội bộ'
    });
  }
});

// Delete user (soft delete - only super admin)
router.delete('/users/:userId', async (req, res) => {
  try {
    const User = require('../model/user_account');
    const user = await User.findByIdAndDelete(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa người dùng thành công'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server nội bộ'
    });
  }
});

// Get all tickets
router.get('/tickets', async (req, res) => {
  try {
    const Ticket = require('../model/ticket_models');
    const { page = 1, limit = 10, status, search } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { ticketId: { $regex: search, $options: 'i' } },
        { passengerName: { $regex: search, $options: 'i' } },
        { passengerPhone: { $regex: search, $options: 'i' } }
      ];
    }

    const tickets = await Ticket.find(query)
      .populate('tripId', 'from to departureTime')
      .sort({ bookingTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ticket.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        tickets,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalTickets: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server nội bộ'
    });
  }
});

module.exports = router;
