const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cartItems: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      title: { type: String, required: true },
      image: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
    },
  ],
  addressId: { type: mongoose.Schema.Types.ObjectId, ref: "Address", required: true },
  orderStatus: {
    type: String,
    enum: ["pending", "confirmed", "delivered", "rejected", "inShipping"],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: ["paypal", "momo", "cash"], // 🔥 Cập nhật đúng giá trị
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  totalAmount: { type: Number, required: true },
  voucherCode: { type: String, default: null }, // ✅ Lưu mã giảm giá nếu có
  orderDate: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
