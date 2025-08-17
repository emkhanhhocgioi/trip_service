const { checkCloudinaryConfig } = require('../utils/cloudiary-utils');

const validateCloudinaryConfig = (req, res, next) => {
  // Chỉ kiểm tra khi có upload ảnh
  const hasImages = req.body.images && req.body.images.length > 0;
  
  if (hasImages && !checkCloudinaryConfig()) {
    return res.status(500).json({
      success: false,
      message: 'Dịch vụ upload ảnh chưa được cấu hình. Vui lòng liên hệ quản trị viên.',
    });
  }
  
  next();
};

module.exports = { validateCloudinaryConfig };
