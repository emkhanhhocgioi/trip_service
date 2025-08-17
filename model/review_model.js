const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  

  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true,
  },
  

  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,

  },
  

  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  

  images: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 10; 
      },
      message: 'Maximum 10 images allowed per review'
    }
  },
  

  timeCreate: {
    type: Date,
    default: Date.now,
  },
  

  isActive: {
    type: Boolean,
    default: true,
  },
  

  isApproved: {
    type: Boolean,
    default: true,
  },
  

  updatedAt: {
    type: Date,
    default: Date.now,
  }
});


ReviewSchema.index({ userId: 1, routeId: 1 }, { unique: true });


ReviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Review", ReviewSchema);