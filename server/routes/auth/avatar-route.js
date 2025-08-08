// server/routes/auth/avatar-route.js
const express = require("express");
const multer = require("multer");
const path = require("path");

const fs = require("fs");
const User = require("../../models/User"); 
const avatarRouter = express.Router();

fs.mkdirSync("images/", { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtention = path.extname(file.originalname);
    const fileName = "local" + "-" + uniqueSuffix + fileExtention;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

// API to update avatar
avatarRouter.post(
  "/upload-avatar",
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send("No file uploaded");
      }
      console.log({ oke: req.file });
      const userId = req.body.userId; // Lấy ID người dùng từ body request (có thể là req.user nếu dùng JWT)

      // Cập nhật thông tin avatar của người dùng
      const user = await User.findByIdAndUpdate(
        {_id: userId},
        { avatar: req.file.filename },
        { new: true }
      );
      console.log({user})

      if (!user) {
        return res.status(404).send("User not found");
      }

      res.status(200).json({
        message: "Avatar updated successfully",
        avatar: req.file.filename,
        user: user,
      });
    } catch (err) {
      console.log({ err });
      res.status(500).send("Server error");
    }
  }
);

// Static files (allow access to uploaded images)
// avatarRouter.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

module.exports = avatarRouter;
