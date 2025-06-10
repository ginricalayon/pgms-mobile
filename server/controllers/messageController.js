const db = require("../config/database");

// Utility function to clean up conversations for expired/cancelled members
exports.cleanupInactiveMemberConversations = async (memberId = null) => {
  try {
    let query;
    let params = [];

    if (memberId) {
      query = `
        SELECT c.id as conversation_id, c.trainer_id, c.client_id, m.status 
        FROM conversations c
        JOIN membership m ON c.client_id = m.customerId
        WHERE c.client_id = ? AND m.status IN ('Expired', 'Cancelled', 'Freezed')
      `;
      params = [memberId];
    } else {
      query = `
        SELECT c.id as conversation_id, c.trainer_id, c.client_id, m.status 
        FROM conversations c
        JOIN membership m ON c.client_id = m.customerId
        WHERE m.status IN ('Expired', 'Cancelled', 'Freezed')
      `;
    }

    const [inactiveConversations] = await db.execute(query, params);

    if (inactiveConversations.length === 0) {
      return { deletedCount: 0, conversations: [] };
    }

    const deletedConversations = [];

    for (const conv of inactiveConversations) {
      try {
        // Delete messages first (foreign key constraint)
        const [deleteMessagesResult] = await db.execute(
          "DELETE FROM messages WHERE conversation_id = ?",
          [conv.conversation_id]
        );

        // Delete conversation
        const [deleteConvResult] = await db.execute(
          "DELETE FROM conversations WHERE id = ?",
          [conv.conversation_id]
        );

        deletedConversations.push({
          conversationId: conv.conversation_id,
          trainerId: conv.trainer_id,
          clientId: conv.client_id,
          memberStatus: conv.status,
          messagesDeleted: deleteMessagesResult.affectedRows,
          conversationDeleted: deleteConvResult.affectedRows,
        });
      } catch (error) {
        console.error(error);
      }
    }

    return {
      deletedCount: deletedConversations.length,
      conversations: deletedConversations,
    };
  } catch (error) {
    console.error(error);
  }
};

// Utility function to check if member can message (is active)
exports.checkMemberMessagingStatus = async (customerId) => {
  try {
    const [memberStatus] = await db.execute(
      "SELECT status FROM membership WHERE customerId = ?",
      [customerId]
    );

    if (memberStatus.length === 0) {
      return {
        canMessage: false,
        status: "Not Found",
        reason: "Member not found",
      };
    }

    const status = memberStatus[0].status;
    const isActive = !["Expired", "Cancelled", "Freezed"].includes(status);

    return {
      canMessage: isActive,
      status: status,
      reason: isActive ? null : `Member status is ${status}`,
    };
  } catch (error) {
    console.error("Error checking member messaging status:", error);
    return { canMessage: false, status: "Error", reason: "Database error" };
  }
};

// Get all conversations for a user (trainer or client)
exports.getConversations = async (req, res) => {
  try {
    const { customerId: userId, role: userType } = req.user;

    // Clean up inactive member conversations first
    try {
      await cleanupInactiveMemberConversations();
    } catch (cleanupError) {
      console.error(
        "Warning: Failed to cleanup inactive conversations:",
        cleanupError
      );
    }

    let query;
    let params;

    if (userType === "trainer") {
      // Trainer viewing all their conversations with active members only
      query = `
          SELECT DISTINCT
            c.id,
            c.client_id as clientId,
            CONCAT(cust.firstName, ' ', cust.lastName) as clientName,
            COALESCE(latest.content, 'No messages yet') as lastMessage,
            COALESCE(latest.timestamp, c.created_at) as lastMessageTime,
            COALESCE(unread.unread_count, 0) as unreadCount,
            COALESCE(status.is_online, 0) as isOnline
          FROM conversations c
          JOIN customer cust ON c.client_id = cust.customerId
          JOIN membership m ON c.client_id = m.customerId
          LEFT JOIN (
            SELECT 
              conversation_id,
              content,
              timestamp,
              ROW_NUMBER() OVER (PARTITION BY conversation_id ORDER BY timestamp DESC) as rn
            FROM messages
          ) latest ON c.id = latest.conversation_id AND latest.rn = 1
          LEFT JOIN (
            SELECT 
              conversation_id,
              COUNT(*) as unread_count
            FROM messages 
            WHERE sender_type = 'client' AND is_read = false
            GROUP BY conversation_id
          ) unread ON c.id = unread.conversation_id
          LEFT JOIN user_status status ON c.client_id = status.user_id AND status.user_type = 'client'
          WHERE c.trainer_id = ? AND m.status NOT IN ('Expired', 'Cancelled', 'Freezed')
          ORDER BY COALESCE(latest.timestamp, c.created_at) DESC
        `;
      params = [userId];
    } else {
      // Member viewing their conversation with trainer (if membership is active)
      const memberCheck = await checkMemberMessagingStatus(userId);

      if (!memberCheck.canMessage) {
        // Clean up their conversations and return empty array
        await cleanupInactiveMemberConversations(userId);
        return res.json([]);
      }

      query = `
          SELECT DISTINCT
            c.id,
            c.trainer_id as clientId,
            CONCAT(pt.firstName, ' ', pt.lastName) as clientName,
            COALESCE(latest.content, 'No messages yet') as lastMessage,
            COALESCE(latest.timestamp, c.created_at) as lastMessageTime,
            COALESCE(unread.unread_count, 0) as unreadCount,
            COALESCE(status.is_online, 0) as isOnline
          FROM conversations c
          JOIN pt_info pt ON c.trainer_id = pt.ptId
          LEFT JOIN (
            SELECT 
              conversation_id,
              content,
              timestamp,
              ROW_NUMBER() OVER (PARTITION BY conversation_id ORDER BY timestamp DESC) as rn
            FROM messages
          ) latest ON c.id = latest.conversation_id AND latest.rn = 1
          LEFT JOIN (
            SELECT 
              conversation_id,
              COUNT(*) as unread_count
            FROM messages 
            WHERE sender_type = 'trainer' AND is_read = false
            GROUP BY conversation_id
          ) unread ON c.id = unread.conversation_id
          LEFT JOIN user_status status ON c.trainer_id = status.user_id AND status.user_type = 'trainer'
          WHERE c.client_id = ?
          ORDER BY COALESCE(latest.timestamp, c.created_at) DESC
        `;
      params = [userId];
    }

    const [conversations] = await db.execute(query, params);

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

// Get messages for a specific conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { customerId: userId } = req.user;

    // Verify user has access to this conversation
    const [conversations] = await db.execute(
      "SELECT * FROM conversations WHERE id = ? AND (trainer_id = ? OR client_id = ?)",
      [conversationId, userId, userId]
    );

    if (conversations.length === 0) {
      return res
        .status(403)
        .json({ error: "Access denied to this conversation" });
    }

    // Get messages
    const [messages] = await db.execute(
      `SELECT 
          id,
          sender_id as senderId,
          sender_name as senderName,
          sender_type as senderType,
          content,
          timestamp,
          is_read as isRead
        FROM messages 
        WHERE conversation_id = ? 
        ORDER BY timestamp ASC`,
      [conversationId]
    );

    // Mark messages as read for the current user
    const { role: userType } = req.user;
    const otherUserType = userType === "trainer" ? "client" : "trainer";

    const [updateResult] = await db.execute(
      "UPDATE messages SET is_read = true WHERE conversation_id = ? AND sender_type = ?",
      [conversationId, otherUserType]
    );

    // Emit socket event to update read status in real-time
    if (updateResult.affectedRows > 0) {
      const io = req.app.get("io");
      if (io) {
        // Get conversation info to determine which users to notify
        const [convInfo] = await db.execute(
          "SELECT trainer_id, client_id FROM conversations WHERE id = ?",
          [conversationId]
        );

        if (convInfo.length > 0) {
          const { trainer_id, client_id } = convInfo[0];

          // Notify both users about the read status update
          io.to(`user_${trainer_id}`).emit("messages_read", {
            conversationId,
            readBy: userType === "trainer" ? "trainer" : "client",
            userId,
          });

          io.to(`user_${client_id}`).emit("messages_read", {
            conversationId,
            readBy: userType === "trainer" ? "trainer" : "client",
            userId,
          });
        }
      }
    }

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// Get messages between trainer and client (by other user ID)
exports.getMessagesByClientId = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { customerId: userId, role: userType } = req.user;

    // Check if member can message (if user is a member)
    if (userType === "member") {
      const memberCheck = await checkMemberMessagingStatus(userId);
      if (!memberCheck.canMessage) {
        // Clean up their conversations
        await cleanupInactiveMemberConversations(userId);
        return res.status(403).json({
          error: "Access denied",
          reason: memberCheck.reason,
          status: memberCheck.status,
        });
      }
    }

    // If trainer is accessing client messages, check if client can message
    if (userType === "trainer") {
      const clientCheck = await checkMemberMessagingStatus(clientId);
      if (!clientCheck.canMessage) {
        // Clean up client's conversations and return empty messages
        await cleanupInactiveMemberConversations(clientId);
        return res.json([]);
      }
    }

    let conversationQuery;
    let conversationParams;

    if (userType === "trainer") {
      // Trainer accessing client messages
      conversationQuery =
        "SELECT id FROM conversations WHERE trainer_id = ? AND client_id = ?";
      conversationParams = [userId, clientId];
    } else if (userType === "member") {
      // Client accessing trainer messages (clientId is actually trainerId in this case)
      conversationQuery =
        "SELECT id FROM conversations WHERE trainer_id = ? AND client_id = ?";
      conversationParams = [clientId, userId];
    } else {
      return res.status(403).json({ error: "Invalid user type" });
    }

    // Find or create conversation
    let [conversations] = await db.execute(
      conversationQuery,
      conversationParams
    );

    let conversationId;
    if (conversations.length === 0) {
      // Create new conversation with UUID
      let insertQuery;
      let insertParams;

      if (userType === "trainer") {
        insertQuery =
          "INSERT INTO conversations (trainer_id, client_id) VALUES (?, ?)";
        insertParams = [userId, clientId];
      } else if (userType === "member") {
        insertQuery =
          "INSERT INTO conversations (trainer_id, client_id) VALUES (?, ?)";
        insertParams = [clientId, userId];
      }

      await db.execute(insertQuery, insertParams);

      // Get the conversation that was just created (UUID is auto-generated)
      const [newConversations] = await db.execute(
        conversationQuery,
        conversationParams
      );

      if (newConversations.length === 0) {
        throw new Error("Failed to create conversation");
      }

      conversationId = newConversations[0].id;
    } else {
      conversationId = conversations[0].id;
    }

    // Get messages
    const [messages] = await db.execute(
      `SELECT 
          id,
          sender_id as senderId,
          sender_name as senderName,
          sender_type as senderType,
          content,
          timestamp,
          is_read as isRead
        FROM messages 
        WHERE conversation_id = ? 
        ORDER BY timestamp ASC`,
      [conversationId]
    );

    // Mark messages as read for the current user
    const otherUserType = userType === "trainer" ? "client" : "trainer";

    const [updateResult] = await db.execute(
      "UPDATE messages SET is_read = true WHERE conversation_id = ? AND sender_type = ?",
      [conversationId, otherUserType]
    );

    // Emit socket event to update read status in real-time
    if (updateResult.affectedRows > 0) {
      const io = req.app.get("io");
      if (io) {
        // Get conversation info to determine which users to notify
        const [convInfo] = await db.execute(
          "SELECT trainer_id, client_id FROM conversations WHERE id = ?",
          [conversationId]
        );

        if (convInfo.length > 0) {
          const { trainer_id, client_id } = convInfo[0];

          // Notify both users about the read status update
          io.to(`user_${trainer_id}`).emit("messages_read", {
            conversationId,
            readBy: userType === "trainer" ? "trainer" : "client",
            userId,
          });

          io.to(`user_${client_id}`).emit("messages_read", {
            conversationId,
            readBy: userType === "trainer" ? "trainer" : "client",
            userId,
          });
        }
      }
    }

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages by client ID:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const {
      customerId: userId,
      role: userType,
      firstName,
      lastName,
    } = req.user;

    if (!recipientId || !content) {
      return res
        .status(400)
        .json({ error: "Recipient ID and content are required" });
    }

    // Validate that firstName and lastName exist
    if (!firstName || !lastName) {
      return res
        .status(400)
        .json({ error: "User name information is missing" });
    }

    // Check if sender (if member) can message
    if (userType === "member") {
      const memberCheck = await checkMemberMessagingStatus(userId);
      if (!memberCheck.canMessage) {
        // Clean up their conversations
        await cleanupInactiveMemberConversations(userId);
        return res.status(403).json({
          error: "Cannot send message",
          reason: memberCheck.reason,
          status: memberCheck.status,
        });
      }
    }

    // Check if recipient (if member) can receive messages
    if (userType === "trainer") {
      const recipientCheck = await checkMemberMessagingStatus(recipientId);
      if (!recipientCheck.canMessage) {
        // Clean up recipient's conversations
        await cleanupInactiveMemberConversations(recipientId);
        return res.status(403).json({
          error: "Cannot send message to this member",
          reason: recipientCheck.reason,
          status: recipientCheck.status,
        });
      }
    }

    // Find or create conversation
    let conversationId;

    if (userType === "trainer") {
      let [conversations] = await db.execute(
        "SELECT id FROM conversations WHERE trainer_id = ? AND client_id = ?",
        [userId, recipientId]
      );

      if (conversations.length === 0) {
        await db.execute(
          "INSERT INTO conversations (trainer_id, client_id) VALUES (?, ?)",
          [userId, recipientId]
        );

        // Get the conversation that was just created (UUID is auto-generated)
        const [newConversations] = await db.execute(
          "SELECT id FROM conversations WHERE trainer_id = ? AND client_id = ?",
          [userId, recipientId]
        );

        if (newConversations.length === 0) {
          throw new Error("Failed to create conversation");
        }

        conversationId = newConversations[0].id;
      } else {
        conversationId = conversations[0].id;
      }
    } else if (userType === "member") {
      let [conversations] = await db.execute(
        "SELECT id FROM conversations WHERE trainer_id = ? AND client_id = ?",
        [recipientId, userId]
      );

      if (conversations.length === 0) {
        await db.execute(
          "INSERT INTO conversations (trainer_id, client_id) VALUES (?, ?)",
          [recipientId, userId]
        );

        // Get the conversation that was just created (UUID is auto-generated)
        const [newConversations] = await db.execute(
          "SELECT id FROM conversations WHERE trainer_id = ? AND client_id = ?",
          [recipientId, userId]
        );

        if (newConversations.length === 0) {
          throw new Error("Failed to create conversation");
        }

        conversationId = newConversations[0].id;
      } else {
        conversationId = conversations[0].id;
      }
    } else {
      return res.status(400).json({ error: "Invalid user type" });
    }

    // Insert message
    const senderName = `${firstName} ${lastName}`;
    const messageId = require("crypto").randomUUID();

    // Map user role to sender type for database
    const senderType = userType === "member" ? "client" : userType;

    try {
      const [result] = await db.execute(
        `INSERT INTO messages (id, conversation_id, sender_id, sender_name, sender_type, content) 
           VALUES (?, ?, ?, ?, ?, ?)`,
        [messageId, conversationId, userId, senderName, senderType, content]
      );
    } catch (insertError) {
      console.error("Error inserting message:", insertError);
      throw insertError;
    }

    // Get the created message
    const [messages] = await db.execute(
      `SELECT 
          id,
          sender_id as senderId,
          sender_name as senderName,
          sender_type as senderType,
          content,
          timestamp,
          is_read as isRead
        FROM messages WHERE id = ?`,
      [messageId]
    );

    if (messages.length === 0) {
      throw new Error("Failed to retrieve inserted message");
    }

    const message = messages[0];

    // Emit real-time event via WebSocket
    const io = req.app.get("io");
    if (io) {
      // For the recipient, clientId should be the sender's ID (the person they're chatting with)
      const recipientEventData = {
        conversationId,
        message,
        clientId: String(userId), // Convert to string for consistency
      };

      // For the sender, clientId should be the recipient's ID (the person they're chatting with)
      const senderEventData = {
        conversationId,
        message,
        clientId: String(recipientId), // Convert to string for consistency
      };

      // Emit to recipient
      io.to(`user_${recipientId}`).emit("new_message", recipientEventData);

      // Also emit to sender (so they see their own message in real-time)
      io.to(`user_${userId}`).emit("new_message", senderEventData);

      // Emit conversation updates to both users
      io.to(`user_${recipientId}`).emit("conversation_update");
      io.to(`user_${userId}`).emit("conversation_update");
    } else {
      console.log("No io instance found!");
    }

    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// Get client info for chat header
exports.getClientInfo = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { role: userType } = req.user;

    let query;
    let params;

    if (userType === "trainer") {
      query = `
          SELECT 
            m.membershipId as id,
            CONCAT(cust.firstName, ' ', cust.lastName) as name,
            m.picture as avatar,
            COALESCE(us.is_online, false) as isOnline,
            CASE 
              WHEN us.is_online = true THEN 'Online'
              WHEN us.last_seen IS NOT NULL THEN CONCAT('Last seen ', DATE_FORMAT(us.last_seen, '%M %d at %h:%i %p'))
              ELSE 'Offline'
            END as lastSeen
          FROM membership m
          LEFT JOIN customer cust ON m.customerId = cust.customerId
          LEFT JOIN user_status us ON m.membershipId = us.user_id AND us.user_type = 'client'
          WHERE m.membershipId = ?
        `;
      params = [clientId];
    } else if (userType === "member") {
      query = `
          SELECT 
            pt.ptId as id,
            CONCAT(pt.firstName, ' ', pt.lastName) as name,
            null as avatar,
            COALESCE(us.is_online, false) as isOnline,
            CASE 
              WHEN us.is_online = true THEN 'Online'
              WHEN us.last_seen IS NOT NULL THEN CONCAT('Last seen ', DATE_FORMAT(us.last_seen, '%M %d at %h:%i %p'))
              ELSE 'Offline'
            END as lastSeen
          FROM pt_info pt
          LEFT JOIN user_status us ON pt.ptId = us.user_id AND us.user_type = 'trainer'
          WHERE pt.ptId = ?
        `;
      params = [clientId];
    } else {
      return res.status(403).json({ error: "Invalid user type" });
    }

    const [users] = await db.execute(query, params);

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(users[0]);
  } catch (error) {
    console.error("Error fetching client info:", error);
    res.status(500).json({ error: "Failed to fetch client info" });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { customerId: userId, role: userType } = req.user;

    // Verify user has access to this conversation
    const [conversations] = await db.execute(
      "SELECT * FROM conversations WHERE id = ? AND (trainer_id = ? OR client_id = ?)",
      [conversationId, userId, userId]
    );

    if (conversations.length === 0) {
      return res
        .status(403)
        .json({ error: "Access denied to this conversation" });
    }

    // Mark messages as read (messages sent by the other user)
    const otherUserType = userType === "trainer" ? "client" : "trainer";
    await db.execute(
      "UPDATE messages SET is_read = true WHERE conversation_id = ? AND sender_type = ?",
      [conversationId, otherUserType]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
};

// Cleanup endpoint for expired/cancelled member conversations
exports.cleanupMemberConversations = async (req, res) => {
  try {
    const { memberId } = req.body;

    const result = await cleanupInactiveMemberConversations(memberId);

    // Emit socket events to notify affected users
    const io = req.app.get("io");
    if (io && result.conversations.length > 0) {
      for (const conv of result.conversations) {
        // Notify trainer that conversation was deleted
        io.to(`user_${conv.trainerId}`).emit("conversation_deleted", {
          conversationId: conv.conversationId,
          clientId: conv.clientId,
          reason: `Member status changed to ${conv.memberStatus}`,
        });

        // Notify client (if they're online) that their access was revoked
        io.to(`user_${conv.clientId}`).emit("conversation_deleted", {
          conversationId: conv.conversationId,
          trainerId: conv.trainerId,
          reason: `Your membership is ${conv.memberStatus}`,
        });
      }
    }

    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} conversations`,
      deletedConversations: result.conversations,
    });
  } catch (error) {
    console.error("Error in cleanup endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cleanup conversations",
    });
  }
};

// Utility function to run general cleanup (can be called periodically)
exports.runGeneralCleanup = async (req, res) => {
  try {
    const result = await cleanupInactiveMemberConversations();

    // Emit socket events to notify affected users
    const io = req.app.get("io");
    if (io && result.conversations.length > 0) {
      for (const conv of result.conversations) {
        // Notify trainer that conversation was deleted
        io.to(`user_${conv.trainerId}`).emit("conversation_deleted", {
          conversationId: conv.conversationId,
          clientId: conv.clientId,
          reason: `Member status is ${conv.memberStatus}`,
        });

        // Notify client (if they're online) that their access was revoked
        io.to(`user_${conv.clientId}`).emit("conversation_deleted", {
          conversationId: conv.conversationId,
          trainerId: conv.trainerId,
          reason: `Your membership is ${conv.memberStatus}`,
        });
      }
    }

    res.json({
      success: true,
      message: `General cleanup completed: ${result.deletedCount} conversations deleted`,
      deletedConversations: result.conversations,
    });
  } catch (error) {
    console.error("Error in general cleanup:", error);
    res.status(500).json({
      success: false,
      error: "Failed to run general cleanup",
    });
  }
};
