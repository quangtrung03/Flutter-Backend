const SupportThread = require("../../models/SupportThread");

// 1. User gửi tin nhắn (tạo mới hoặc append)
exports.startOrAppendUserMessage = async (req, res) => {
  try {
    const { userEmail, userName, message } = req.body;

    // Validate input
    if (!userEmail || !message) {
      return res.status(400).json({ 
        success: false,
        error: "userEmail and message are required" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid email format" 
      });
    }

    // Validate message length
    if (message.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "Message cannot be empty" 
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({ 
        success: false,
        error: "Message too long (max 1000 characters)" 
      });
    }

    let thread = await SupportThread.findOne({ userEmail });

    if (!thread) {
      // Tạo thread mới
      thread = new SupportThread({
        userEmail,
        userName: userName || 'Anonymous User',
        messages: [{ 
          sender: "user", 
          content: message.trim(),
          timestamp: new Date()
        }],
        isReadByAdmin: false,
        status: 'active'
      });
    } else {
      // Cập nhật thread hiện có
      if (userName && thread.userName !== userName) {
        thread.userName = userName;
      }
      
      thread.messages.push({ 
        sender: "user", 
        content: message.trim(),
        timestamp: new Date()
      });
      
      thread.isReadByAdmin = false;
      thread.status = 'active';
      thread.updatedAt = new Date();
    }

    await thread.save();
    
    res.status(200).json({
      success: true,
      data: thread,
      message: "Message sent successfully"
    });
  } catch (error) {
    console.error("startOrAppendUserMessage error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to send message. Please try again later." 
    });
  }
};

// 2. Admin gửi tin nhắn
exports.sendAdminMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, adminName } = req.body;

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "Message content is required" 
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({ 
        success: false,
        error: "Message too long (max 1000 characters)" 
      });
    }

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid thread ID" 
      });
    }

    const thread = await SupportThread.findById(id);
    if (!thread) {
      return res.status(404).json({ 
        success: false,
        error: "Thread not found" 
      });
    }

    // Thêm tin nhắn từ admin
    thread.messages.push({ 
      sender: "admin", 
      content: content.trim(),
      adminName: adminName || 'Support Admin',
      timestamp: new Date()
    });
    
    thread.updatedAt = new Date();
    thread.isReadByAdmin = true;
    thread.status = 'active';
    
    await thread.save();

    res.status(200).json({
      success: true,
      data: thread,
      message: "Admin message sent successfully"
    });
  } catch (error) {
    console.error("sendAdminMessage error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to send admin message. Please try again later." 
    });
  }
};

// 3. Admin xem toàn bộ hội thoại
exports.getAllThreads = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, unreadOnly } = req.query;
    
    // Build filter
    let filter = {};
    if (status && ['active', 'resolved', 'pending'].includes(status)) {
      filter.status = status;
    }
    
    // Filter for unread messages
    if (unreadOnly === 'true') {
      filter.isReadByAdmin = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const threads = await SupportThread.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('userEmail userName messages updatedAt createdAt isReadByAdmin status lastMessageAt');
    
    // Add additional info for each thread
    const threadsWithInfo = threads.map(thread => {
      const lastMessage = thread.messages.length > 0 ? 
        thread.messages[thread.messages.length - 1] : null;
      
      return {
        ...thread.toObject(),
        messageCount: thread.messages.length,
        lastMessage: lastMessage ? {
          content: lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? '...' : ''),
          sender: lastMessage.sender,
          timestamp: lastMessage.timestamp
        } : null,
        hasUnreadFromUser: lastMessage ? lastMessage.sender === 'user' && !thread.isReadByAdmin : false
      };
    });

    // Get total count for pagination
    const total = await SupportThread.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        threads: threadsWithInfo,
        pagination: {
          current: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("getAllThreads error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to get threads. Please try again later." 
    });
  }
};

// 4. Lấy theo ID (admin)
exports.getThreadById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid thread ID" 
      });
    }

    const thread = await SupportThread.findById(id);
    if (!thread) {
      return res.status(404).json({ 
        success: false,
        error: "Thread not found" 
      });
    }

    res.status(200).json({
      success: true,
      data: thread
    });
  } catch (error) {
    console.error("getThreadById error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to get thread. Please try again later." 
    });
  }
};

// 5. Lấy theo email (user)
exports.getThreadByEmail = async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid email format" 
      });
    }

    const thread = await SupportThread.findOne({ userEmail: email });

    if (!thread) {
      return res.status(404).json({ 
        success: false,
        error: "No conversation found for this email",
        data: null
      });
    }

    res.status(200).json({
      success: true,
      data: thread
    });
  } catch (error) {
    console.error("getThreadByEmail error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to get conversation. Please try again later." 
    });
  }
};

// 6. Thống kê chat
exports.getChatStats = async (req, res) => {
  try {
    // Parallel queries for better performance
    const [
      totalThreads,
      activeThreads,
      resolvedThreads,
      pendingThreads,
      threadsToday,
      threadsThisWeek,
      unreadThreads
    ] = await Promise.all([
      SupportThread.countDocuments(),
      SupportThread.countDocuments({ status: 'active' }),
      SupportThread.countDocuments({ status: 'resolved' }),
      SupportThread.countDocuments({ status: 'pending' }),
      SupportThread.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      SupportThread.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      SupportThread.countDocuments({ isReadByAdmin: false })
    ]);

    // Get total messages count
    const totalMessagesResult = await SupportThread.aggregate([
      { $unwind: '$messages' },
      { $count: 'total' }
    ]);
    const totalMessages = totalMessagesResult.length > 0 ? totalMessagesResult[0].total : 0;

    // Get user messages vs admin messages
    const messageStatsResult = await SupportThread.aggregate([
      { $unwind: '$messages' },
      { 
        $group: {
          _id: '$messages.sender',
          count: { $sum: 1 }
        }
      }
    ]);

    const userMessages = messageStatsResult.find(stat => stat._id === 'user')?.count || 0;
    const adminMessages = messageStatsResult.find(stat => stat._id === 'admin')?.count || 0;

    // Get recent activity (last 24 hours)
    const recentActivity = await SupportThread.find({
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
    .sort({ updatedAt: -1 })
    .limit(5)
    .select('userEmail userName updatedAt messages')
    .lean();

    const recentActivityFormatted = recentActivity.map(thread => ({
      userEmail: thread.userEmail,
      userName: thread.userName,
      lastActivity: thread.updatedAt,
      lastMessage: thread.messages.length > 0 ? 
        thread.messages[thread.messages.length - 1].content.substring(0, 50) + '...' : ''
    }));

    const stats = {
      overview: {
        totalThreads,
        activeThreads,
        resolvedThreads,
        pendingThreads,
        unreadThreads
      },
      activity: {
        threadsToday,
        threadsThisWeek,
        totalMessages,
        userMessages,
        adminMessages
      },
      recentActivity: recentActivityFormatted,
      responseRate: totalMessages > 0 ? ((adminMessages / userMessages) * 100).toFixed(1) : 0
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("getChatStats error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to get chat statistics. Please try again later." 
    });
  }
};

// 7. Đánh dấu thread đã đọc
exports.markThreadAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid thread ID" 
      });
    }
    
    const thread = await SupportThread.findByIdAndUpdate(
      id,
      { 
        isReadByAdmin: true,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!thread) {
      return res.status(404).json({ 
        success: false,
        error: "Thread not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "Thread marked as read successfully",
      data: { isReadByAdmin: true }
    });
  } catch (error) {
    console.error("markThreadAsRead error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to mark thread as read. Please try again later." 
    });
  }
};

// 8. Cập nhật trạng thái thread
exports.updateThreadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid thread ID" 
      });
    }

    // Validate status
    if (!status || !['active', 'resolved', 'pending'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid status. Must be one of: active, resolved, pending" 
      });
    }
    
    const thread = await SupportThread.findByIdAndUpdate(
      id,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!thread) {
      return res.status(404).json({ 
        success: false,
        error: "Thread not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: `Thread status updated to ${status} successfully`,
      data: thread
    });
  } catch (error) {
    console.error("updateThreadStatus error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to update thread status. Please try again later." 
    });
  }
};

// 9. Xóa thread (soft delete bằng cách đổi status)
exports.deleteThread = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid thread ID" 
      });
    }
    
    const thread = await SupportThread.findById(id);
    if (!thread) {
      return res.status(404).json({ 
        success: false,
        error: "Thread not found" 
      });
    }

    // Soft delete by updating status
    thread.status = 'resolved';
    thread.updatedAt = new Date();
    await thread.save();

    res.status(200).json({ 
      success: true,
      message: "Thread deleted successfully"
    });
  } catch (error) {
    console.error("deleteThread error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to delete thread. Please try again later." 
    });
  }
};