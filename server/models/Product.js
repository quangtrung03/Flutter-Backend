const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    size: { type: String, default: "M" },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, default: 0, min: 0 },
    totalStock: { type: Number, required: true, min: 0 },
    averageReview: { type: Number, default: 0, min: 0, max: 5 },
    stockStatus: { type: String, enum: ["inStock", "outOfStock"], default: "inStock" },
  },
  { timestamps: true }
);

// Middleware trước khi lưu sản phẩm
ProductSchema.pre("save", function (next) {
  // Cập nhật trạng thái kho dựa trên tổng số lượng tồn kho
  this.stockStatus = this.totalStock > 0 ? "inStock" : "outOfStock";

  // Đảm bảo giá bán không vượt quá giá gốc
  if (this.salePrice > this.price) {
    return next(new Error("Sale price cannot be greater than the original price."));
  }

  next();
});

// Middleware trước khi cập nhật sản phẩm
ProductSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  // Cập nhật trạng thái kho nếu `totalStock` được thay đổi
  if (update.totalStock !== undefined) {
    update.stockStatus = update.totalStock > 0 ? "inStock" : "outOfStock";
  }

  // Đảm bảo giá bán không vượt quá giá gốc
  if (update.salePrice !== undefined && update.price !== undefined && update.salePrice > update.price) {
    return next(new Error("Sale price cannot be greater than the original price."));
  }

  next();
});

module.exports = mongoose.model("Product", ProductSchema);