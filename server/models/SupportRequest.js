const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  response: { type: String }, // phản hồi từ admin
  respondedAt: { type: Date }, // thời gian phản hồi
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SupportRequest', supportRequestSchema);
