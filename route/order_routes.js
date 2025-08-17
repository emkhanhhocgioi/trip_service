const express = require('express');
const router = express.Router();

const {
  createOrder,
  acceptOrder,
  declineOrder,
  getOrdersByrouteId,
  getUserOrders,
  getOrdersByPhoneNumber,
  getPopularRoutes,
  createPayment,
  handlePaymentReturn,
  checkoutRouteOrder,
  createQRPayment,
  checkQRPaymentStatus,
  verifyQRPayment,
  setPrepaidStatus,
  getOrderbyID
} = require('../controller/order_controller');

router.post('/order/create', createOrder);
router.put('/order/accept/:orderId', acceptOrder);
router.put('/order/decline/:orderId', declineOrder);
router.put('/order/set-prepaid/:orderId', setPrepaidStatus);
router.get('/order/popular-routes', getPopularRoutes);
router.get('/order/:orderId', getOrderbyID);
router.get('/order/route/:routeId', getOrdersByrouteId);
router.get('/user/orders/:userId', getUserOrders);
router.get('/order/phone-search/:phoneNumber', getOrdersByPhoneNumber);
router.put('/order/checkout/:routeId', checkoutRouteOrder);
// Payment routes
router.post('/payment/create', createPayment);
router.get('/payment/vnpay-return', handlePaymentReturn);

// QR Payment routes
router.post('/payment/qr/create', createQRPayment);
router.get('/payment/qr/status/:orderId', checkQRPaymentStatus);
router.get('/payment/qr/verify', verifyQRPayment);






module.exports = router;