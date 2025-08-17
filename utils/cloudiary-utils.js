const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret'
});

// Kiểm tra cấu hình Cloudinary
const checkCloudinaryConfig = () => {
  const config = cloudinary.config();
  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    console.warn('Cloudinary chưa được cấu hình đầy đủ. Vui lòng kiểm tra biến môi trường.');
    return false;
  }
  return true;
};

module.exports = { cloudinary, checkCloudinaryConfig };
