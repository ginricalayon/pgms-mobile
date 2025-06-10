const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const authMiddleware = require("../middleware/authMiddleware");

// All message routes require authentication
router.use(authMiddleware);

// Get all conversations for the current user
router.get("/conversations", messageController.getConversations);

// Get messages for a specific conversation (legacy)
router.get("/conversation/:conversationId", messageController.getMessages);

// Get messages by client ID (creates conversation if doesn't exist)
router.get("/messages/:clientId", messageController.getMessagesByClientId);

// Send a new message
router.post("/send", messageController.sendMessage);

// Get client/trainer info for chat header
router.get("/client-info/:clientId", messageController.getClientInfo);

// Mark messages as read
router.post("/mark-read", messageController.markAsRead);

// Cleanup expired/cancelled member conversations
router.post("/cleanup", messageController.cleanupMemberConversations);

// Run general cleanup (admin endpoint)
router.post("/cleanup/all", messageController.runGeneralCleanup);

// Legacy routes (keeping for backward compatibility)
router.get("/:clientId", messageController.getMessagesByClientId);
router.post("/", messageController.sendMessage);
router.get("/user/:clientId", messageController.getClientInfo);
router.put("/conversation/:conversationId/read", messageController.markAsRead);

module.exports = router;
