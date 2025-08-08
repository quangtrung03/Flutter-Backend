const { imageUploadUtil } = require("../../helpers/cloudinary");
const Blog = require("../../models/Blog");

// Get all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ date: -1 });
    res.status(200).json({
      success: true,
      data: blogs,
      total: blogs.length,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách blog:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách blog",
    });
  }
};

// Get blog by ID
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết." });
    }
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    console.error("Lỗi khi lấy bài viết:", error);
    res.status(500).json({ success: false, message: "Lỗi khi lấy bài viết." });
  }
};

// Create blog
exports.createBlog = async (req, res) => {
  try {
    const { title, content, image } = req.body;

    if (!title || !content || !image) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin tiêu đề, nội dung hoặc ảnh.",
      });
    }

    const newBlog = new Blog({ title, content, image });
    const saved = await newBlog.save();

    res.status(201).json({
      success: true,
      message: "Tạo bài viết thành công",
      data: saved,
    });
  } catch (error) {
    console.error("Lỗi khi tạo blog:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo bài viết.",
    });
  }
};

// Update blog
exports.updateBlog = async (req, res) => {
  try {
    const updated = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết để cập nhật." });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật thành công",
      data: updated,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật blog:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật bài viết.",
    });
  }
};

// Delete blog
exports.deleteBlog = async (req, res) => {
  try {
    const deleted = await Blog.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết để xoá." });
    }

    res.status(200).json({
      success: true,
      message: "Xoá bài viết thành công",
    });
  } catch (error) {
    console.error("Lỗi khi xoá blog:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xoá bài viết.",
    });
  }
};

// Upload image
exports.handleImageUpload = async (req, res) => {
  try {
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const url = "data:" + req.file.mimetype + ";base64," + b64;
    const result = await imageUploadUtil(url);

    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Lỗi khi upload ảnh:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi upload ảnh",
    });
  }
};
