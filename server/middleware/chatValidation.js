// Middleware for validating support chat requests
const validator = require('validator');

// Validate user message request
exports.validateUserMessage = (req, res, next) => {
  const { userEmail, userName, message } = req.body;
  const errors = [];

  // Validate email
  if (!userEmail) {
    errors.push('Email is required');
  } else if (!validator.isEmail(userEmail)) {
    errors.push('Invalid email format');
  }

  // Validate message
  if (!message) {
    errors.push('Message is required');
  } else if (typeof message !== 'string') {
    errors.push('Message must be a string');
  } else if (message.trim().length === 0) {
    errors.push('Message cannot be empty');
  } else if (message.length > 1000) {
    errors.push('Message too long (max 1000 characters)');
  }

  // Validate userName (optional)
  if (userName && typeof userName !== 'string') {
    errors.push('User name must be a string');
  } else if (userName && userName.length > 100) {
    errors.push('User name too long (max 100 characters)');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Validate admin message request
exports.validateAdminMessage = (req, res, next) => {
  const { content, adminName } = req.body;
  const errors = [];

  // Validate content
  if (!content) {
    errors.push('Message content is required');
  } else if (typeof content !== 'string') {
    errors.push('Message content must be a string');
  } else if (content.trim().length === 0) {
    errors.push('Message content cannot be empty');
  } else if (content.length > 1000) {
    errors.push('Message content too long (max 1000 characters)');
  }

  // Validate adminName (optional)
  if (adminName && typeof adminName !== 'string') {
    errors.push('Admin name must be a string');
  } else if (adminName && adminName.length > 100) {
    errors.push('Admin name too long (max 100 characters)');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Validate MongoDB ObjectId
exports.validateObjectId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
  }

  next();
};

// Validate status update request
exports.validateStatusUpdate = (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['active', 'resolved', 'pending'];

  if (!status) {
    return res.status(400).json({
      success: false,
      error: 'Status is required'
    });
  }

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  next();
};

// Validate pagination parameters
exports.validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page && (!Number.isInteger(+page) || +page < 1)) {
    return res.status(400).json({
      success: false,
      error: 'Page must be a positive integer'
    });
  }

  if (limit && (!Number.isInteger(+limit) || +limit < 1 || +limit > 100)) {
    return res.status(400).json({
      success: false,
      error: 'Limit must be a positive integer between 1 and 100'
    });
  }

  next();
};

// Rate limiting for chat messages (prevent spam)
const messageRateLimits = new Map();

exports.rateLimitMessages = (req, res, next) => {
  const { userEmail } = req.body;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxMessages = 5; // Max 5 messages per minute

  if (!userEmail) {
    return next(); // Let other validation handle this
  }

  if (!messageRateLimits.has(userEmail)) {
    messageRateLimits.set(userEmail, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const userLimit = messageRateLimits.get(userEmail);

  if (now > userLimit.resetTime) {
    // Reset the window
    messageRateLimits.set(userEmail, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (userLimit.count >= maxMessages) {
    return res.status(429).json({
      success: false,
      error: 'Too many messages. Please wait before sending another message.',
      retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
    });
  }

  userLimit.count++;
  return next();
};

// Clean up old rate limit entries (call this periodically)
exports.cleanupRateLimits = () => {
  const now = Date.now();
  for (const [userEmail, limit] of messageRateLimits.entries()) {
    if (now > limit.resetTime) {
      messageRateLimits.delete(userEmail);
    }
  }
};

// Set up periodic cleanup (every 5 minutes)
setInterval(exports.cleanupRateLimits, 5 * 60 * 1000);
