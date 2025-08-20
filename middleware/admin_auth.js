const jwt = require('jsonwebtoken');
const Admin = require('../model/admin_model');

// Middleware to verify admin JWT token
const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token không được cung cấp'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'admin_secret_key');
    
    // Find admin in database
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin không tồn tại'
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản admin đã bị vô hiệu hóa'
      });
    }

    // Add admin info to request
    req.admin = {
      id: admin._id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server nội bộ'
    });
  }
};

// Middleware to check permissions
const checkPermission = (resource, action) => {
  return (req, res, next) => {
    try {
      const { permissions } = req.admin;
      
      if (!permissions[resource] || !permissions[resource][action]) {
        return res.status(403).json({
          success: false,
          message: `Bạn không có quyền ${action} cho ${resource}`
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server nội bộ'
      });
    }
  };
};

// Middleware to check if admin is super admin
const requireSuperAdmin = (req, res, next) => {
  try {
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ super admin mới có thể thực hiện hành động này'
      });
    }
    next();
  } catch (error) {
    console.error('Super admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server nội bộ'
    });
  }
};

module.exports = {
  verifyAdminToken,
  checkPermission,
  requireSuperAdmin
};
