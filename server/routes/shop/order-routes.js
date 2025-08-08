const express = require("express");

const {
  createOrder,
  getAllOrdersByUser,
  getOrderDetails,
  capturePayment,
  getTotalRevenue,
} = require("../../controllers/shop/order-controller");

const router = express.Router();

// Tạo đơn hàng
router.post("/", createOrder);

// Thanh toán đơn hàng (PayPal)
router.post("/capture", capturePayment);

// Lấy danh sách đơn hàng của người dùng
router.get("/user/:userId", getAllOrdersByUser);

// Lấy chi tiết đơn hàng
router.get("/:id", getOrderDetails);

// Thống kê tổng doanh thu
router.get("/stats/total-revenue", getTotalRevenue);

module.exports = router;
