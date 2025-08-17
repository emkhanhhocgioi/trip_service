const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  // Route reference
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bussinessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true,
  },
  // Seat number
  seatNumber: {
    type: String,
    required: false,
  },
  
  // Passenger information
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  
  dateOfBirth: {
    type: String,
    default: '',
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'male'
  },
  
  // Payment information
  paymentMethod: {
    type: String,
    enum: [ 'bank_transfer', 'e_wallet', 'cash', 'vnpay', 'vnpay_qr'],
    required: true,
  },
  
  // Payment status and details
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionNo: {
    type: String,
    default: null
  },
  bankCode: {
    type: String,
    default: null
  },
  paymentDate: {
    type: Date,
    default: null
  },
  paymentAttemptAt: {
    type: Date,
    default: null
  },
  paymentFailureReason: {
    type: String,
    default: null
  },
  
  // QR Payment specific fields
  qrPaymentAttemptAt: {
    type: Date,
    default: null
  },
  qrExpiryTime: {
    type: Date,
    default: null
  },
  qrString: {
    type: String,
    default: null
  },
  
  // VNPay specific fields
  vnpayTransactionNo: {
    type: String,
    default: null
  },
  vnpayResponseCode: {
    type: String,
    default: null
  },
  vnpayBankCode: {
    type: String,
    default: null
  },
  vnpayPayDate: {
    type: String,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  paymentFailedAt: {
    type: Date,
    default: null
  },
  
  // Pricing
  basePrice: {
    type: Number,
    required: true,
  },
  fees: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
  
  // Status
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'paid', 'finished', 'prepaid'],
    default: 'pending'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  finishedAt: {
    type: Date,
    default: null,
  }
});

module.exports = mongoose.model("Order", OrderSchema);
