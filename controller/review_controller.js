const Review = require('../model/review_model');
const User = require('../model/user_account');
const Route = require('../model/trip_model');
const mongoose = require('mongoose');

// Tạo review mới
const createReview = async (req, res) => {
  try {
    const { userId, routeId, rating, comment, images } = req.body;
    console.log('Received data:', { userId, routeId, rating, comment });
    // Kiểm tra dữ liệu đầu vào
    if (!userId || !routeId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: userId, routeId, rating, comment'
      });
    }

    // Kiểm tra rating hợp lệ
    if (rating < 1 || rating > 5 ) {
      return res.status(400).json({
        success: false,
        message: 'Rating phải là số nguyên từ 1 đến 5'
      });
    }

    // Kiểm tra xem user đã review route này chưa
    const existingReview = await Review.findOne({ userId, routeId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá route này rồi'
      });
    }

    // Tạo review mới
    const newReview = new Review({
      userId,
      routeId,
      rating,
      comment,
      images: images || []
    });

    const savedReview = await newReview.save();

    res.status(201).json({
      success: true,
      message: 'Tạo review thành công',
      data: savedReview
    });

  } catch (error) {
    console.error('Lỗi tạo review:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo review',
      error: error.message
    });
  }
};

// Lấy tất cả reviews
const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, routeId, userId, rating, isActive = true } = req.query;
    
    // Tạo filter object
    const filter = { isActive };
    
    if (routeId) filter.routeId = routeId;
    if (userId) filter.userId = userId;
    if (rating) filter.rating = parseInt(rating);

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(filter)
      .populate('userId', 'name email')
      .populate('routeId', 'from to routeCode price')
      .sort({ timeCreate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách review thành công',
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalReviews: total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Lỗi lấy danh sách review:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách review',
      error: error.message
    });
  }
};

// Lấy review theo ID
const getReviewById = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;

    // Tạo filter
    const filter = { routeId: new mongoose.Types.ObjectId(routeId), isActive: true, isApproved: true };
    if (rating) filter.rating = parseInt(rating);

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(filter)
      .populate('userId', 'name email')
      .sort({ timeCreate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    // Tính rating trung bình
    const avgRatingResult = await Review.aggregate([
      { $match: { routeId: new mongoose.Types.ObjectId(routeId), isActive: true, isApproved: true } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
    ]);

    const avgRating = avgRatingResult.length > 0 ? avgRatingResult[0].avgRating : 0;
    const totalReviews = avgRatingResult.length > 0 ? avgRatingResult[0].totalReviews : 0;

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách review theo route thành công',
      data: {
        reviews,
        statistics: {
          averageRating: Math.round(avgRating * 10) / 10,
          totalReviews
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalReviews: total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Lỗi lấy danh sách review theo route:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách review theo route',
      error: error.message
    });
  }
};

// Lấy reviews theo routeId
const getReviewsByRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;

    // Tạo filter
    const filter = { routeId: new mongoose.Types.ObjectId(routeId), isActive: true, isApproved: true };
    if (rating) filter.rating = parseInt(rating);

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(filter)
      .populate('userId', 'name email')
      .sort({ timeCreate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    // Tính rating trung bình
    const avgRatingResult = await Review.aggregate([
      { $match: { routeId: new mongoose.Types.ObjectId(routeId), isActive: true, isApproved: true } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
    ]);

    const avgRating = avgRatingResult.length > 0 ? avgRatingResult[0].avgRating : 0;
    const totalReviews = avgRatingResult.length > 0 ? avgRatingResult[0].totalReviews : 0;

    res.status(200).json({
      success: true,
      message: 'Lấy reviews theo route thành công',
      data: {
        reviews,
        statistics: {
          averageRating: Math.round(avgRating * 10) / 10,
          totalReviews
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalReviews: total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Lỗi lấy reviews theo route:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy reviews theo route',
      error: error.message
    });
  }
};

// Cập nhật review
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, images } = req.body;
    const userId = req.user?.id; // Assuming user info from auth middleware

    // Tìm review
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy review'
      });
    }

    // Kiểm tra quyền sở hữu (user chỉ được sửa review của mình)
    if (review.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sửa review này'
      });
    }

    // Validate dữ liệu
    const updateData = {};
    
    if (rating !== undefined) {
      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return res.status(400).json({
          success: false,
          message: 'Rating phải là số nguyên từ 1 đến 5'
        });
      }
      updateData.rating = rating;
    }

    if (comment !== undefined) {
      if (!comment.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Comment không được để trống'
        });
      }
      updateData.comment = comment.trim();
    }

    if (images !== undefined) {
      if (images.length > 10) {
        return res.status(400).json({
          success: false,
          message: 'Tối đa 10 hình ảnh'
        });
      }
      updateData.images = images;
    }

    updateData.updatedAt = new Date();

    // Cập nhật review
    const updatedReview = await Review.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email')
     .populate('routeId', 'from to routeCode price');

    res.status(200).json({
      success: true,
      message: 'Cập nhật review thành công',
      data: updatedReview
    });

  } catch (error) {
    console.error('Lỗi cập nhật review:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật review',
      error: error.message
    });
  }
};

// Xóa review (soft delete)
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // Assuming user info from auth middleware

    // Tìm review
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy review'
      });
    }

    // Kiểm tra quyền sở hữu (user chỉ được xóa review của mình)
    if (review.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa review này'
      });
    }

    // Soft delete - set isActive = false
    const deletedReview = await Review.findByIdAndUpdate(
      id,
      { 
        isActive: false,
        updatedAt: new Date()
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Xóa review thành công',
      data: deletedReview
    });

  } catch (error) {
    console.error('Lỗi xóa review:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa review',
      error: error.message
    });
  }
};

// Xóa review vĩnh viễn (chỉ admin)
const hardDeleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy review'
      });
    }

    await Review.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Xóa review vĩnh viễn thành công'
    });

  } catch (error) {
    console.error('Lỗi xóa vĩnh viễn review:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa vĩnh viễn review',
      error: error.message
    });
  }
};

// Approve/Disapprove review (chỉ admin)
const toggleApproveReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy review'
      });
    }

    const updatedReview = await Review.findByIdAndUpdate(
      id,
      { 
        isApproved: isApproved !== undefined ? isApproved : !review.isApproved,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('userId', 'name email')
     .populate('routeId', 'from to routeCode price');

    res.status(200).json({
      success: true,
      message: `${updatedReview.isApproved ? 'Approve' : 'Disapprove'} review thành công`,
      data: updatedReview
    });

  } catch (error) {
    console.error('Lỗi toggle approve review:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi toggle approve review',
      error: error.message
    });
  }
};

module.exports = {
  createReview,
  getAllReviews,
  getReviewById,
  getReviewsByRoute,
  updateReview,
  deleteReview,
  hardDeleteReview,
  toggleApproveReview
};