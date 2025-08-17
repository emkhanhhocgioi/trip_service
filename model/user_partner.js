const mongoose = require("mongoose");
const partnerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  company: { type: String, required: true },
  address: { type: String, required: true },
  password: { type: String, required: true },
  businessLicense: { type: String, default: "" },
  vehicleCount: { type: Number, default: 0 },
  operatingYears: { type: Number, default: 0 },
  routes: { type: String, default: "" },
  website: { type: String, default: "" },
  description: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  profilePicture: { type: String, default: "" },
  walletAddress: { type: String, default: "" },
  walletBalance: { type: Number, default: 0 },
});

const Partner = mongoose.model("Partner", partnerSchema);

module.exports = Partner;