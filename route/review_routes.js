const express = require('express'); 
const router = express.Router();



const {
  createReview,
  getAllReviews,
  getReviewById,
  getReviewsByRoute,
  updateReview,
  deleteReview,
  
} = require('../controller/review_controller'); 


router.post('/create', createReview);

// Lấy tất cả reviews (admin hoặc public với filter)
router.get('/all', getAllReviews);

// Lấy review theo ID (public)
router.get('/route/review/:routeId', getReviewById);

// Lấy reviews theo routeId (public)
router.get('/route/:routeId', getReviewsByRoute);

// Cập nhật review (cần authentication và ownership)
router.put('/update/:id', updateReview);

// Xóa review (cần authentication và ownership)
router.delete('/delete/:id', deleteReview);


module.exports = router;

module.exports = router;