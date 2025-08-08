const express = require('express');
const router = express.Router();
const userController = require('../../controllers/admin/user-controller.js');

// Lấy danh sách tất cả người dùng
router.get('/', userController.getAllUsers);

// 🔧 NEW: Lấy chi tiết một người dùng
router.get('/get-user/:id', userController.getUserById);

// Tạo người dùng mới
router.post('/', userController.createUser);

// Cập nhật thông tin người dùng
router.put('/:id', userController.updateUser);

// Xóa người dùng
router.delete('/:id', userController.deleteUser);

module.exports = router;