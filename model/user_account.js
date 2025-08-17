const mongoose = require("mongoose") ;
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  recentBookings: [
    {
      type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
    },
    ],
    userType: {
      type: String,
      enum: ["user", "admin", ],
      default: "user",
    },
    isVerified: { type: Boolean, default: false },
    profilePicture: { type: String, default: "" },
    walletAddress: { type: String, default: "" },
    walletBalance: { type: Number, default: 0 },
    


});

const User = mongoose.model("User", userSchema);

module.exports = User;