const Admin = require("../model/admin_model");
const User = require("../model/user_account");
const Partner = require("../model/user_partner");
const Order = require("../model/order_model");
const Route = require("../model/trip_model");
const Ticket = require("../model/ticket_models");
const Review = require("../model/review_model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Admin Authentication
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Admin login request:', { email, password });
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email và password là bắt buộc"
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc password không đúng"
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản admin đã bị vô hiệu hóa"
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc password không đúng"
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin._id, 
        email: admin.email, 
        role: admin.role,
        permissions: admin.permissions 
      },
      process.env.JWT_SECRET || "admin_secret_key",
      { expiresIn: "24h" }
    );

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          lastLogin: admin.lastLogin
        },
        token
      }
    });

  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ"
    });
  }
};

// Create new admin (only super_admin can create)
const createAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const creatorId = req.admin.id;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Tất cả các trường là bắt buộc"
      });
    }

    // Check if creator has permission (only super_admin can create admins)
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: "Chỉ super admin mới có thể tạo admin mới"
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }]
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin với email hoặc số điện thoại này đã tồn tại"
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new admin
    const newAdmin = new Admin({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: role || 'admin',
      createdBy: creatorId
    });

    await newAdmin.save();

    // Return admin data without password
    const adminData = {
      id: newAdmin._id,
      name: newAdmin.name,
      email: newAdmin.email,
      phone: newAdmin.phone,
      role: newAdmin.role,
      permissions: newAdmin.permissions,
      isActive: newAdmin.isActive,
      createdAt: newAdmin.createdAt
    };

    res.status(201).json({
      success: true,
      message: "Tạo admin mới thành công",
      data: adminData
    });

  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ"
    });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const usersCount = await User.countDocuments();
    const partnersCount = await Partner.countDocuments();
    const ordersCount = await Order.countDocuments();
    const routesCount = await Route.countDocuments();
    const ticketsCount = await Ticket.countDocuments();
    const reviewsCount = await Review.countDocuments();

    // Get orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get revenue statistics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueStats = await Order.aggregate([
      {
        $match: {
          paymentStatus: "completed",
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent orders
    const recentOrders = await Order.find()
      .populate("userId", "name email")
      .populate("routeId", "from to departureTime")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          users: usersCount,
          partners: partnersCount,
          orders: ordersCount,
          routes: routesCount,
          tickets: ticketsCount,
          reviews: reviewsCount
        },
        ordersByStatus,
        revenue: revenueStats[0] || { totalRevenue: 0, count: 0 },
        recentOrders
      }
    });

  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ"
    });
  }
};

// User Management
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, userType } = req.query;
    
    // Build query
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (userType) {
      query.userType = userType;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ"
    });
  }
};

// Partner Management
const getAllPartners = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isVerified } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (isVerified !== undefined) {
      query.isVerified = isVerified === 'true';
    }

    const partners = await Partner.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Partner.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        partners,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalPartners: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error("Get partners error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ"
    });
  }
};

// Verify/Unverify Partner
const togglePartnerVerification = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { isVerified } = req.body;

    const partner = await Partner.findByIdAndUpdate(
      partnerId,
      { isVerified },
      { new: true }
    ).select('-password');

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đối tác"
      });
    }

    res.status(200).json({
      success: true,
      message: `${isVerified ? 'Xác thực' : 'Hủy xác thực'} đối tác thành công`,
      data: partner
    });

  } catch (error) {
    console.error("Toggle partner verification error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ"
    });
  }
};

// Order Management
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, orderStatus, paymentStatus, search } = req.query;
    
    let query = {};
    if (orderStatus) query.orderStatus = orderStatus;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .populate('routeId', 'from to departureTime price')
      .populate('bussinessId', 'company')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalOrders: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ"
    });
  }
};

// Review Management
const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, isApproved, rating } = req.query;
    
    let query = {};
    if (isApproved !== undefined) query.isApproved = isApproved === 'true';
    if (rating) query.rating = rating;

    const reviews = await Review.find(query)
      .populate('userId', 'name email')
      .populate('routeId', 'from to')
      .sort({ timeCreate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalReviews: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ"
    });
  }
};

// Approve/Reject Review
const toggleReviewApproval = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { isApproved } = req.body;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { isApproved },
      { new: true }
    ).populate('userId', 'name email')
     .populate('routeId', 'from to');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá"
      });
    }

    res.status(200).json({
      success: true,
      message: `${isApproved ? 'Phê duyệt' : 'Từ chối'} đánh giá thành công`,
      data: review
    });

  } catch (error) {
    console.error("Toggle review approval error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ"
    });
  }
};

// Route Management
const getAllRoutes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive, partnerId } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { from: { $regex: search, $options: 'i' } },
        { to: { $regex: search, $options: 'i' } },
        { routeCode: { $regex: search, $options: 'i' } }
      ];
    }
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (partnerId) query.partnerId = partnerId;

    const routes = await Route.find(query)
      .populate('partnerId', 'company email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Route.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        routes,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRoutes: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error("Get routes error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ"
    });
  }
};

// Toggle Route Active Status
const toggleRouteStatus = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { isActive } = req.body;

    const route = await Route.findByIdAndUpdate(
      routeId,
      { isActive },
      { new: true }
    ).populate('partnerId', 'company email');

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tuyến đường"
      });
    }

    res.status(200).json({
      success: true,
      message: `${isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} tuyến đường thành công`,
      data: route
    });

  } catch (error) {
    console.error("Toggle route status error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ"
    });
  }
};

// Verify admin token and return admin info
const verifyAdmin = async (req, res) => {
  try {
    // The admin info is already attached by verifyAdminToken middleware
    res.status(200).json({
      success: true,
      admin: req.admin
    });
  } catch (error) {
    console.error("Verify admin error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ"
    });
  }
};

module.exports = {
  // Authentication
  adminLogin,
  createAdmin,
  verifyAdmin,
  
  // Dashboard
  getDashboardStats,
  
  // User Management
  getAllUsers,
  
  // Partner Management
  getAllPartners,
  togglePartnerVerification,
  
  // Order Management
  getAllOrders,
  
  // Review Management
  getAllReviews,
  toggleReviewApproval,
  
  // Route Management
  getAllRoutes,
  toggleRouteStatus
};
