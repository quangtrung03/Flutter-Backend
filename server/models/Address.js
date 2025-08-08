const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    streetAddress: { type: String, required: true }, // Số nhà, tên đường
    ward: { type: String, required: true }, // Phường/Xã
    district: { type: String, required: true }, // Quận/Huyện
    city: { type: String, required: true }, // Tỉnh/Thành phố
    phone: { type: String, required: true }, // Số điện thoại
    notes: String, // Ghi chú thêm
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", AddressSchema);
