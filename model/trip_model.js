const mongoose = require("mongoose");

const RouteSchema = new mongoose.Schema({
  routeCode: {
    type: String,
    required: true,
    unique: true,
  },
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner', // Assuming you have a Partner model
    required: true,
  },
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  departureTime: {
    type: String, 
    required: true,
  },
  duration: {
    type: String, // ví dụ: "4h30m"
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  totalSeats: {
    type: Number,
    required: true,
  },
  availableSeats: {
    type: Number,
    default: function() {
      return this.totalSeats;
    }
  },
  bookedSeats: {
    type: [{
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
      },
      seatNumber: {
        type: String,
        required: false
      },
      bookedAt: {
        type: Date,
        default: Date.now
      }
    }],
    default: []
  },
  busType: {
    type: String,
    required: true,
  },
  licensePlate: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  tags: {
    type: [String], // Mảng các thẻ (tags) mô tả chuy
    required: false,
  },
  description: {
    type: String,
  },
  images: {
    type: [String], // Mảng các link ảnh từ Cloudinary
    default: [],
    required: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("Route", RouteSchema);