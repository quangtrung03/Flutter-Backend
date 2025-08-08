const express = require("express");
const router = express.Router();
const blogController = require("../../controllers/admin/blog-controller");
const { upload } = require("../../helpers/cloudinary.js");

// Blog routes
router.get("/", blogController.getAllBlogs); // Get all blogs
router.get("/:id", blogController.getBlogById); // Get a blog by ID
router.post("/", blogController.createBlog); // Create a new blog
router.put("/:id", blogController.updateBlog); // Update a blog by ID
router.delete("/:id", blogController.deleteBlog); // Delete a blog by ID

// Image upload route
router.post(
  "/upload-image",
  upload.single("my_file"),
  blogController.handleImageUpload
);

module.exports = router;