const Order = require("../../models/Order");
const User = require("../../models/User"); // ✅ Thêm import User model
const mongoose = require("mongoose"); // ✅ Thêm mongoose để validate ObjectId

// 🚀 MAIN OPTIMIZED ENDPOINT - Unified filtering and pagination
const getOrdersWithFilters = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'all',
      userId = 'all',
      paymentMethod = 'all',
      sortBy = 'date_desc',
      search = '',
      startDate,
      endDate,
      minAmount,
      maxAmount
    } = req.query;

    // 🔍 Build MongoDB query with smart filtering
    const query = {};
    
    if (status !== 'all') query.orderStatus = status;
    if (userId !== 'all' && mongoose.Types.ObjectId.isValid(userId)) query.userId = userId;
    if (paymentMethod !== 'all') query.paymentMethod = paymentMethod;
    
    if (startDate && endDate) {
      query.orderDate = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }
    
    if (minAmount || maxAmount) {
      query.totalAmount = {};
      if (minAmount) query.totalAmount.$gte = parseFloat(minAmount);
      if (maxAmount) query.totalAmount.$lte = parseFloat(maxAmount);
    }

    // 🔤 Build sort criteria - CHỈ THEO THỜI GIAN
    const sortCriteria = {};
    switch (sortBy) {
      case 'date_desc': 
      case 'newest':
        sortCriteria.orderDate = -1; break;
      case 'date_asc': 
      case 'oldest':
        sortCriteria.orderDate = 1; break;
      default: 
        sortCriteria.orderDate = -1; // Mặc định: mới nhất trước
    }

    // 📊 Get total count for pagination
    const totalOrders = await Order.countDocuments(query);
    
    // 📑 Execute main query với populate và pagination
    let ordersQuery = Order.find(query)
      .sort(sortCriteria)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    let orders = await ordersQuery;

    // 📝 Transform orders để đảm bảo userId là string
    orders = orders.map(order => {
      const orderObj = order.toObject();
      // Đảm bảo userId là string
      if (orderObj.userId && typeof orderObj.userId === 'object') {
        orderObj.userId = orderObj.userId._id || orderObj.userId.toString();
      }
      // Đảm bảo addressId là string
      if (orderObj.addressId && typeof orderObj.addressId === 'object') {
        orderObj.addressId = orderObj.addressId._id || orderObj.addressId.toString();
      }
      return orderObj;
    });

    // 🔍 Apply search filter đơn giản chỉ theo order ID  
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase();
      orders = orders.filter(order => {
        return order._id.toString().toLowerCase().includes(searchLower);
      });
    }

    // 📈 Calculate status counts for current filter
    const statusPipeline = [
      { $match: query },
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
    ];
    
    const statusResults = await Order.aggregate(statusPipeline);
    const statusCounts = {
      all: totalOrders,
      pending: 0, confirmed: 0, inShipping: 0, delivered: 0, rejected: 0
    };
    
    statusResults.forEach(result => {
      if (statusCounts.hasOwnProperty(result._id)) {
        statusCounts[result._id] = result.count;
      }
    });

    const stats = {
      total: totalOrders,
      page: parseInt(page),
      totalPages: Math.ceil(totalOrders / limit),
      limit: parseInt(limit),
      hasNext: page * limit < totalOrders,
      hasPrev: page > 1,
      statusCounts,
      totalRevenue: await Order.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]).then(result => result[0]?.total || 0)
    };

    res.status(200).json({
      success: true,
      data: orders,
      stats,
      filters: { status, userId, paymentMethod, sortBy, search, startDate, endDate, minAmount, maxAmount }
    });

  } catch (error) {
    console.error("getOrdersWithFilters error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching filtered orders",
      error: error.message
    });
  }
};

// 🔄 Legacy endpoint for backward compatibility
const getAllOrdersOfAllUsers = async (req, res) => {
  // Check if this is a filtered request
  if (Object.keys(req.query).length > 0) {
    return getOrdersWithFilters(req, res);
  }

  try {
    const orders = await Order.find({})
      .populate('userId', 'userName email')
      .populate('addressId')
      .populate('cartItems.productId', 'title image price')
      .sort({ orderDate: -1 });

    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.orderStatus === 'pending').length,
      confirmed: orders.filter(o => o.orderStatus === 'confirmed').length,
      delivered: orders.filter(o => o.orderStatus === 'delivered').length,
      rejected: orders.filter(o => o.orderStatus === 'rejected').length,
      totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0)
    };

    res.status(200).json({
      success: true,
      data: orders,
      stats: stats,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getOrderDetailsForAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format!",
      });
    }

    const order = await Order.findById(id)
      .populate("addressId")               // ✅ lấy chi tiết địa chỉ
      .populate("cartItems.productId");    // (tuỳ chọn) lấy chi tiết sản phẩm nếu cần

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.error('Get order details error:', e);
    res.status(500).json({
      success: false,
      message: "Error retrieving order details!",
    });
  }
};


const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, status } = req.body; // ✅ Hỗ trợ cả 2 field

    // ✅ Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format!",
      });
    }

    // ✅ Ưu tiên orderStatus, fallback về status
    const newStatus = orderStatus || status;
    
    if (!newStatus) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing orderStatus or status field!" 
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found!" 
      });
    }

    // ✅ Validation cho status
    const validStatuses = ['pending', 'confirmed', 'inShipping', 'delivered', 'rejected'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Valid values: ${validStatuses.join(', ')}` 
      });
    }

    // ✅ Update order status trực tiếp với updateOne và không lấy lại data
    const updateResult = await Order.updateOne(
      { _id: id },
      { 
        orderStatus: newStatus,
        orderUpdateDate: new Date()
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found!" 
      });
    }

    // Sau khi cập nhật trạng thái, gửi thông báo cho user
    try {
      const updatedOrder = await Order.findById(id);
      if (updatedOrder) {
        const user = await User.findById(updatedOrder.userId);
        if (user && user.email) {
          // Gửi email thông báo trạng thái đơn hàng
          // Sử dụng logic từ notification-route.js
          const nodemailer = require('nodemailer');
          const createEmailTransporter = () => {
            return nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
              }
            });
          };
          const transporter = createEmailTransporter();
          const subject = `📦 Cập nhật đơn hàng #${updatedOrder._id}`;
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #8B4513;">The Coffee Shop</h2>
              <h3>Xin chào ${user.userName},</h3>
              <p>Đơn hàng <strong>#${updatedOrder._id}</strong> của bạn đã được cập nhật.</p>
              <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Trạng thái mới:</strong> ${updatedOrder.orderStatus}</p>
                <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
              </div>
            </div>
          `;
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject,
            html
          });
        }
      }
    } catch (notifyErr) {
      console.error('Gửi thông báo trạng thái đơn hàng thất bại:', notifyErr);
    }
    res.status(200).json({
      success: true,
      message: `Order status updated to ${newStatus} successfully!`,
      modifiedCount: updateResult.modifiedCount
    });
  } catch (e) {
    console.error('Update order status error:', e);
    res.status(500).json({ 
      success: false, 
      message: "Error updating order status!" 
    });
  }
};
const getTotalOrders = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    res.status(200).json({ totalOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getTotalRevenue = async (req, res) => {
  try {
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    res.status(200).json({ totalRevenue: totalRevenue[0]?.total || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getSalesPerMonth = async (req, res) => {
  try {
    // Lấy năm hiện tại hoặc năm được chỉ định
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    
    const salesData = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid", // Chỉ tính đơn hàng đã thanh toán
          orderDate: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { month: { $month: "$orderDate" } },
          totalSales: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.month": 1 }
      }
    ]);

    // Tạo array 12 tháng với dữ liệu thật
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const graphData = Array.from({ length: 12 }, (_, i) => {
      const monthData = salesData.find(item => item._id.month === i + 1);
      return {
        name: monthNames[i],
        month: i + 1,
        sales: monthData ? monthData.totalSales : 0,
        orders: monthData ? monthData.orderCount : 0,
        salesInK: monthData ? Math.round(monthData.totalSales / 1000) : 0 // Cho biểu đồ
      };
    });

    res.status(200).json({ 
      success: true, 
      data: graphData,
      year: year,
      totalYearSales: graphData.reduce((sum, month) => sum + month.sales, 0),
      totalYearOrders: graphData.reduce((sum, month) => sum + month.orders, 0)
    });
  } catch (error) {
    console.error("getSalesPerMonth error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Some error occurred!",
      error: error.message 
    });
  }
};

// ✅ Thêm method lọc đơn hàng theo trạng thái
const getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ['pending', 'confirmed', 'delivered', 'rejected', 'inShipping'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status!",
      });
    }

    const orders = await Order.find({ orderStatus: status })
      .populate('userId', 'userName email')
      .populate('addressId')
      .populate('cartItems.productId', 'title image price')
      .sort({ orderDate: -1 });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

// ✅ Thêm method lọc đơn hàng theo payment method
const getOrdersByPaymentMethod = async (req, res) => {
  try {
    const { method } = req.params;
    const validMethods = ['paypal', 'momo', 'cash'];
    
    if (!validMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method!",
      });
    }

    const orders = await Order.find({ paymentMethod: method })
      .populate('userId', 'userName email')
      .populate('addressId')
      .populate('cartItems.productId', 'title image price')
      .sort({ orderDate: -1 });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Tổng doanh thu
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // Doanh thu hôm nay
    const todayRevenue = await Order.aggregate([
      { 
        $match: { 
          paymentStatus: "paid",
          orderDate: { $gte: startOfDay }
        } 
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // Doanh thu tuần này
    const weekRevenue = await Order.aggregate([
      { 
        $match: { 
          paymentStatus: "paid",
          orderDate: { $gte: startOfWeek }
        } 
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // Doanh thu tháng này
    const monthRevenue = await Order.aggregate([
      { 
        $match: { 
          paymentStatus: "paid",
          orderDate: { $gte: startOfMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // Tổng đơn hàng
    const totalOrders = await Order.countDocuments();
    const todayOrders = await Order.countDocuments({ 
      orderDate: { $gte: startOfDay } 
    });
    const weekOrders = await Order.countDocuments({ 
      orderDate: { $gte: startOfWeek } 
    });
    const monthOrders = await Order.countDocuments({ 
      orderDate: { $gte: startOfMonth } 
    });

    // Tổng khách hàng
    const totalCustomers = await Order.distinct("userId").then(users => users.length);

    // Sản phẩm bán chạy nhất
    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      { 
        $group: { 
          _id: "$items.productId", 
          name: { $first: "$items.name" },
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        } 
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    // Doanh thu 7 ngày gần đây
    const last7Days = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          orderDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" },
            day: { $dayOfMonth: "$orderDate" }
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    const stats = {
      revenue: {
        total: totalRevenue[0]?.total || 0,
        today: todayRevenue[0]?.total || 0,
        week: weekRevenue[0]?.total || 0,
        month: monthRevenue[0]?.total || 0
      },
      orders: {
        total: totalOrders,
        today: todayOrders,
        week: weekOrders,
        month: monthOrders
      },
      customers: totalCustomers,
      topProducts: topProducts,
      last7Days: last7Days
    };

    res.status(200).json({ 
      success: true, 
      data: stats,
      message: "Dashboard stats retrieved successfully"
    });

  } catch (error) {
    console.error("getDashboardStats error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error retrieving dashboard stats",
      error: error.message 
    });
  }
};

// ✅ API lọc đơn hàng theo khoảng thời gian
const getOrdersByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required"
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day

    const orders = await Order.find({
      orderDate: {
        $gte: start,
        $lte: end
      }
    })
    .populate('userId', 'userName email')
    .populate('addressId')
    .populate('cartItems.productId', 'title image price')
    .sort({ orderDate: -1 });

    res.status(200).json({
      success: true,
      data: orders,
      dateRange: {
        startDate: startDate,
        endDate: endDate,
        count: orders.length
      }
    });
  } catch (error) {
    console.error("getOrdersByDateRange error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders by date range",
      error: error.message
    });
  }
};

// ✅ API lấy danh sách user kèm số lượng đơn hàng
const getUsersWithOrderCount = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }, 'userName email createdAt')
      .sort({ userName: 1 });

    // Tính số đơn hàng cho mỗi user
    const usersWithOrderCount = await Promise.all(
      users.map(async (user) => {
        const orderCount = await Order.countDocuments({ userId: user._id });
        const totalSpent = await Order.aggregate([
          { $match: { userId: user._id, orderStatus: 'delivered' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        
        return {
          _id: user._id,
          userName: user.userName,
          email: user.email,
          createdAt: user.createdAt,
          orderCount: orderCount,
          totalSpent: totalSpent[0]?.total || 0
        };
      })
    );

    res.status(200).json({
      success: true,
      data: usersWithOrderCount.filter(user => user.orderCount > 0), // Chỉ hiển thị user có đơn hàng
      message: "Users with order count retrieved successfully"
    });
  } catch (error) {
    console.error("getUsersWithOrderCount error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users with order count",
      error: error.message
    });
  }
};

// ✅ API lấy đơn hàng theo user ID
const getOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format"
      });
    }

    const orders = await Order.find({ userId: userId })
      .populate('userId', 'userName email')
      .populate('addressId')
      .populate('cartItems.productId', 'title image price')
      .sort({ orderDate: -1 });

    const user = await User.findById(userId, 'userName email');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
      user: user,
      count: orders.length,
      message: `Orders for user ${user.userName} retrieved successfully`
    });
  } catch (error) {
    console.error("getOrdersByUserId error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders by user ID",
      error: error.message
    });
  }
};

// 👥 Get users with order statistics (optimized aggregation)
const getUsersWithOrderStats = async (req, res) => {
  try {
    const usersWithStats = await User.aggregate([
      { $match: { role: 'user' } },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'userId',
          as: 'orders'
        }
      },
      {
        $addFields: {
          orderCount: { $size: '$orders' },
          totalSpent: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$orders',
                    cond: { $eq: ['$$this.orderStatus', 'delivered'] }
                  }
                },
                as: 'order',
                in: '$$order.totalAmount'
              }
            }
          },
          lastOrderDate: { $max: '$orders.orderDate' }
        }
      },
      {
        $match: { orderCount: { $gt: 0 } }
      },
      {
        $project: {
          userName: 1,
          email: 1,
          createdAt: 1,
          orderCount: 1,
          totalSpent: 1,
          lastOrderDate: 1
        }
      },
      { $sort: { orderCount: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: usersWithStats
    });

  } catch (error) {
    console.error("getUsersWithOrderStats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users with order stats",
      error: error.message
    });
  }
};

module.exports = {
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
};
