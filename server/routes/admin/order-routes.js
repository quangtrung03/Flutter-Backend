const express = require("express");

const {
  getAllOrdersOfAllUsers,
  getOrdersWithFilters, // 🚀 New optimized endpoint
  getOrderDetailsForAdmin,
  updateOrderStatus,
  getOrdersByStatus,
  getOrdersByPaymentMethod,
  getTotalOrders,
  getTotalRevenue,
  getSalesPerMonth,
  getDashboardStats,
  getOrdersByDateRange,
  getUsersWithOrderCount,
  getUsersWithOrderStats, // 🚀 New optimized user stats
  getOrdersByUserId,
} = require("../../controllers/admin/order-controller.js");

const router = express.Router();

// 🚀 OPTIMIZED ENDPOINTS
router.get("/", getOrdersWithFilters); // Main endpoint with filtering and pagination
router.get("/optimized", getOrdersWithFilters); // Alternative path
router.get("/users-stats", getUsersWithOrderStats); // Users with order statistics

// EXISTING ENDPOINTS
router.get("/get", getAllOrdersOfAllUsers);
router.get("/details/:id", getOrderDetailsForAdmin);
router.put("/update/:id", updateOrderStatus);
router.get("/filter/status/:status", getOrdersByStatus);
router.get("/filter/payment/:method", getOrdersByPaymentMethod);
router.get("/filter/date-range", getOrdersByDateRange);
router.get("/filter/user/:userId", getOrdersByUserId);
router.get("/users-with-orders", getUsersWithOrderCount);
router.get('/total-orders', getTotalOrders); 
router.get('/total-revenue', getTotalRevenue);
router.get('/sales-per-month', getSalesPerMonth);
router.get('/dashboard-stats', getDashboardStats);

module.exports = router;
