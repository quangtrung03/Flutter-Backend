const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Số lượng phải lớn hơn 0"],
      default: 1,
    },
    // Optional: lưu snapshot giá và thông tin tại thời điểm thêm vào
    title: String,
    price: Number,
    salePrice: Number,
    image: String,
  },
  { _id: false } // không cần _id cho từng item nếu không cần thao tác riêng
);

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Mỗi user chỉ có 1 giỏ hàng
    },
    items: [CartItemSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Cart", CartSchema);
