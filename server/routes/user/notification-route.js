const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const nodemailer = require('nodemailer');
const { authMiddleware } = require('../../controllers/auth/auth-controller');

// Email transporter configuration
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// GET /api/user/notification-settings - Lấy cài đặt thông báo của user
router.get('/notification-settings', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const settings = user.notificationSettings || {
      newOrder: true,
      orderStatusUpdate: true,
      orderDelivered: true,
      orderCancelled: true,
      promotions: false,
      newProduct: false,
    };

    res.json({
      success: true,
      settings: settings
    });

  } catch (error) {
    console.error('Error getting notification settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/user/notification-settings - Cập nhật cài đặt thông báo
router.put('/notification-settings', authMiddleware, async (req, res) => {
  try {
    const { setting, enabled } = req.body;

    if (!setting || typeof enabled !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid setting or enabled value' 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.notificationSettings) {
      user.notificationSettings = {
        newOrder: true,
        orderStatusUpdate: true,
        orderDelivered: true,
        orderCancelled: true,
        promotions: false,
        newProduct: false,
      };
    }

    user.notificationSettings[setting] = enabled;
    await user.save();

    res.json({
      success: true,
      message: 'Notification setting updated successfully',
      settings: user.notificationSettings
    });

  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/user/send-notification - Gửi thông báo đến user đã đăng nhập
router.post('/send-notification', authMiddleware, async (req, res) => {
  try {
    const { type, orderId, orderData } = req.body;

    if (!type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type is required' 
      });
    }

    // Lấy user từ database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Kiểm tra settings của user
    const settings = user.notificationSettings || {};
    if (settings[type] === false) {
      return res.json({
        success: true,
        message: 'Notification blocked by user settings',
        blocked: true
      });
    }

    const transporter = createEmailTransporter();

    // Template email theo loại thông báo
    const getEmailTemplate = (type, user, orderId, orderData) => {
      const templates = {
        newOrder: {
          subject: `🎉 Đơn hàng mới #${orderId || 'NEW'} đã được tạo!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #8B4513;">The Coffee Shop</h2>
              <h3>Xin chào ${user.userName},</h3>
              <p>Đơn hàng <strong>#${orderId || 'NEW'}</strong> của bạn đã được tạo thành công!</p>
              <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4>Chi tiết đơn hàng:</h4>
                <p><strong>Mã đơn hàng:</strong> #${orderId || 'NEW'}</p>
                ${orderData ? `<p><strong>Tổng tiền:</strong> ${orderData.totalAmount || 'N/A'} VNĐ</p>` : ''}
                <p><strong>Trạng thái:</strong> Đang xử lý</p>
                <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
              </div>
              <p>Cảm ơn bạn đã mua hàng tại The Coffee Shop!</p>
            </div>
          `
        },
        orderStatusUpdate: {
          subject: `📦 Cập nhật đơn hàng #${orderId || 'ORDER'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #8B4513;">The Coffee Shop</h2>
              <h3>Xin chào ${user.userName},</h3>
              <p>Đơn hàng <strong>#${orderId || 'ORDER'}</strong> của bạn đã được cập nhật.</p>
              <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Trạng thái mới:</strong> ${orderData?.status || 'Đang xử lý'}</p>
                <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
              </div>
            </div>
          `
        },
        orderDelivered: {
          subject: `✅ Đơn hàng #${orderId || 'ORDER'} đã được giao!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #8B4513;">The Coffee Shop</h2>
              <h3>🎉 Xin chào ${user.userName},</h3>
              <p>Đơn hàng <strong>#${orderId || 'ORDER'}</strong> đã được giao thành công!</p>
              <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Thời gian giao:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                <p><strong>Trạng thái:</strong> Hoàn thành</p>
              </div>
              <p>Cảm ơn bạn đã tin tưởng The Coffee Shop!</p>
            </div>
          `
        },
        orderCancelled: {
          subject: `❌ Đơn hàng #${orderId || 'ORDER'} đã bị hủy`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #8B4513;">The Coffee Shop</h2>
              <h3>Xin chào ${user.userName},</h3>
              <p>Đơn hàng <strong>#${orderId || 'ORDER'}</strong> đã bị hủy.</p>
              <div style="background: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Lý do:</strong> ${orderData?.cancelReason || 'Không xác định'}</p>
                <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
              </div>
              <p>Xin lỗi vì sự bất tiện này.</p>
            </div>
          `
        }
      };
      return templates[type];
    };

    const template = getEmailTemplate(type, user, orderId, orderData);
    if (!template) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid notification type' 
      });
    }

    // Gửi email
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@coffeeshop.com',
      to: user.email,
      subject: template.subject,
      html: template.html
    });

    res.json({
      success: true,
      message: 'Notification sent successfully',
      sentTo: user.email,
      type: type
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send notification',
      error: error.message 
    });
  }
});

module.exports = router;
