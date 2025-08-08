const express = require("express");
const router = express.Router();
const chatController = require("../../controllers/common/supportChat-controller");
const {
  validateUserMessage,
  validateAdminMessage,
  validateObjectId,
  validateStatusUpdate,
  validatePagination,
  rateLimitMessages
} = require("../../middleware/chatValidation");

// User routes
router.post("/user/message", 
  rateLimitMessages,
  validateUserMessage,
  chatController.startOrAppendUserMessage
);

router.get("/user/:email", chatController.getThreadByEmail);

// Admin routes
router.get("/admin/threads", 
  validatePagination,
  chatController.getAllThreads
);

router.get("/admin/stats", chatController.getChatStats);

router.get("/admin/:id", 
  validateObjectId,
  chatController.getThreadById
);

router.post("/admin/:id/message", 
  validateObjectId,
  validateAdminMessage,
  chatController.sendAdminMessage
);

router.put("/admin/:id/read", 
  validateObjectId,
  chatController.markThreadAsRead
);

router.put("/admin/:id/status", 
  validateObjectId,
  validateStatusUpdate,
  chatController.updateThreadStatus
);

router.delete("/admin/:id", 
  validateObjectId,
  chatController.deleteThread
);

module.exports = router;
