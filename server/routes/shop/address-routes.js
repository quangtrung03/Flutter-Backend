const express = require("express");

const {
  addAddress,
  fetchAllAddress,
  editAddress,
  deleteAddress,
} = require("../../controllers/shop/address-controller");

const router = express.Router();

// Thêm địa chỉ mới
router.post("/", addAddress);

// Lấy danh sách địa chỉ của người dùng
router.get("/:userId", fetchAllAddress);

// Cập nhật địa chỉ
router.put("/:userId/:addressId", editAddress);

// Xóa địa chỉ
router.delete("/:userId/:addressId", deleteAddress);

module.exports = router;
