const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ["user", "admin"], required: true },
  content: { type: String, required: true, maxlength: 1000 },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  adminName: { type: String }, // Tên admin nếu là tin nhắn từ admin
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date }
});

const supportThreadSchema = new mongoose.Schema(
  {
    userEmail: { 
      type: String, 
      required: true, 
      index: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
    },
    userName: { 
      type: String, 
      default: 'Anonymous User',
      trim: true,
      maxlength: 100
    },
    messages: [messageSchema],
    isReadByAdmin: { type: Boolean, default: false },
    lastMessageAt: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ["active", "resolved", "pending"], 
      default: "active" 
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: 50
    }],
    assignedTo: {
      type: String, // Admin ID hoặc tên
      trim: true
    },
    isDeleted: { type: Boolean, default: false }
  },
  { 
    timestamps: true,
    // Tối ưu hóa cho queries thường dùng
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes để tối ưu query
supportThreadSchema.index({ userEmail: 1 });
supportThreadSchema.index({ updatedAt: -1 });
supportThreadSchema.index({ status: 1 });
supportThreadSchema.index({ isReadByAdmin: 1 });
supportThreadSchema.index({ "messages.sender": 1 });
supportThreadSchema.index({ isDeleted: 1 });
supportThreadSchema.index({ priority: 1 });

// Compound indexes
supportThreadSchema.index({ status: 1, updatedAt: -1 });
supportThreadSchema.index({ isReadByAdmin: 1, updatedAt: -1 });

// Virtual để đếm số tin nhắn
supportThreadSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Virtual để lấy tin nhắn cuối
supportThreadSchema.virtual('lastMessage').get(function() {
  if (this.messages.length === 0) return null;
  return this.messages[this.messages.length - 1];
});

// Virtual để kiểm tra có tin nhắn chưa đọc từ user không
supportThreadSchema.virtual('hasUnreadFromUser').get(function() {
  const lastMessage = this.lastMessage;
  return lastMessage && lastMessage.sender === 'user' && !this.isReadByAdmin;
});

// Middleware để cập nhật lastMessageAt
supportThreadSchema.pre('save', function(next) {
  if (this.messages && this.messages.length > 0) {
    this.lastMessageAt = this.messages[this.messages.length - 1].timestamp;
  }
  
  // Nếu có tin nhắn mới từ user, đánh dấu chưa đọc
  if (this.isModified('messages')) {
    const lastMessage = this.messages[this.messages.length - 1];
    if (lastMessage && lastMessage.sender === 'user') {
      this.isReadByAdmin = false;
    }
  }
  
  next();
});

// Middleware để không trả về threads đã xóa (soft delete)
supportThreadSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Static methods
supportThreadSchema.statics.findByEmail = function(email) {
  return this.findOne({ userEmail: email.toLowerCase() });
};

supportThreadSchema.statics.getUnreadCount = function() {
  return this.countDocuments({ isReadByAdmin: false });
};

supportThreadSchema.statics.getActiveThreads = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ updatedAt: -1 })
    .limit(limit);
};

// Instance methods
supportThreadSchema.methods.markAsRead = function() {
  this.isReadByAdmin = true;
  this.updatedAt = new Date();
  return this.save();
};

supportThreadSchema.methods.addMessage = function(sender, content, adminName = null) {
  this.messages.push({
    sender,
    content: content.trim(),
    timestamp: new Date(),
    adminName: sender === 'admin' ? adminName : undefined
  });
  
  if (sender === 'user') {
    this.isReadByAdmin = false;
  }
  
  this.updatedAt = new Date();
  return this.save();
};

module.exports = mongoose.model("SupportThread", supportThreadSchema);
