const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
    required: true
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  passengerName: {
    type: String,
    required: true
  },
  passengerPhone: {
    type: String,
    required: true
  },
  bookingTime: {
    type: Date,
    default: Date.now
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'booked', 'cancelled', 'checked-in', 'used'],
    default: 'booked'
  },
  expiredDate: {
    type: Date,
  },
  // NFT Storage fields
  pdfCid: {
    type: String,
    default: ''
  },
  metadataCid: {
    type: String,
    default: ''
  },
  nftStorageUrl: {
    type: String,
    default: ''
  },
  metadataUrl: {
    type: String,
    default: ''
  },
  // Blockchain fields
  contractAddress: {
    type: String,
    default: ''
  },
  blockchainTxHash: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('Ticket', ticketSchema);