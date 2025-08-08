const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema({
  code: { type: String, required: true},
  type: { type: String, enum: ["percent", "fixed"], required: true },
  value: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 100000 },
  expiredAt: { type: Date },
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("Voucher", voucherSchema);
