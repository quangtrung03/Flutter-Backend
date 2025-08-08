const express = require("express");
const upload = require("../../helpers/upload-avatar.multer"); 
const path = require("path"); 
const authController = require('../../controllers/auth/auth-controller');
const {
  loginUser,
  logoutUser,
  authMiddleware,
  getTotalUsers,
  registerUser
} = require("../../controllers/auth/auth-controller");

const router = express.Router();
router.post('/register', authController.registerUser); 
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/check-auth", authMiddleware, (req, res) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    message: "Người dùng được xác thực!",
    user,
  });
});
router.get('/total-users', getTotalUsers);



module.exports = router;
