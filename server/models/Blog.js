const mongoose = require("mongoose");
const slugify = require('slugify'); // Thêm thư viện slugify

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String, required: true },
  slug: { type: String, unique: true }, // Thêm trường slug
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true
});

// Tạo slug tự động trước khi lưu
blogSchema.pre('save', function(next) {
  if (this.title) {
    this.slug = slugify(this.title, {
      lower: true,      // Chuyển thành chữ thường
      strict: true,     // Chỉ giữ ký tự chữ và số
      locale: 'vi'      // Hỗ trợ tiếng Việt
    });
  }
  next();
});

module.exports = mongoose.model("Blog", blogSchema);