const jwt = require("jsonwebtoken");
const db = require("../config/database");

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // socketId -> user info
    this.userSockets = new Map(); // userId -> Set of socketIds

    this.io.on("connection", (socket) => {
      this.handleConnection(socket);
    });
  }

  async handleConnection(socket) {
    // Handle authentication
    socket.on("authenticate", async (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = {
          id: decoded.customerId,
          accountId: decoded.id,
          type: decoded.role,
          firstName: decoded.firstName,
          lastName: decoded.lastName,
        };

        // Store user info
        this.connectedUsers.set(socket.id, user);

        // Add socket to user's socket set
        if (!this.userSockets.has(user.id)) {
          this.userSockets.set(user.id, new Set());
        }
        this.userSockets.get(user.id).add(socket.id);

        // Join user to their personal room
        socket.join(`user_${user.id}`);

        // Update user status to online
        await this.updateUserStatus(user.id, user.type, true, socket.id);

        // Notify others about online status
        this.broadcastUserStatusUpdate(user.id, user.type, true);

        socket.emit("authenticated", { success: true });
      } catch (error) {
        console.error("Authentication failed:", error);
        socket.emit("authentication_error", { error: "Invalid token" });
      }
    });

    // Handle joining specific conversation rooms
    socket.on("join_conversation", (conversationId) => {
      socket.join(`conversation_${conversationId}`);
    });

    // Handle leaving conversation rooms
    socket.on("leave_conversation", (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
    });

    // Handle typing indicators
    socket.on("typing_start", (data) => {
      const user = this.connectedUsers.get(socket.id);
      if (user && data.conversationId) {
        socket.to(`conversation_${data.conversationId}`).emit("user_typing", {
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          typing: true,
        });
      }
    });

    socket.on("typing_stop", (data) => {
      const user = this.connectedUsers.get(socket.id);
      if (user && data.conversationId) {
        socket.to(`conversation_${data.conversationId}`).emit("user_typing", {
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          typing: false,
        });
      }
    });

    // Handle message read receipts
    socket.on("message_read", async (data) => {
      try {
        const user = this.connectedUsers.get(socket.id);
        if (user && data.messageId) {
          // Update message as read in database
          await db.execute("UPDATE messages SET is_read = true WHERE id = ?", [
            data.messageId,
          ]);

          // Notify sender about read receipt
          socket
            .to(`conversation_${data.conversationId}`)
            .emit("message_read_receipt", {
              messageId: data.messageId,
              readBy: user.id,
            });
        }
      } catch (error) {
        console.error("Error handling message read:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      await this.handleDisconnection(socket);
    });
  }

  async handleDisconnection(socket) {
    const user = this.connectedUsers.get(socket.id);
    if (user) {
      // Remove socket from user's socket set
      if (this.userSockets.has(user.id)) {
        this.userSockets.get(user.id).delete(socket.id);

        // If user has no more active sockets, mark as offline
        if (this.userSockets.get(user.id).size === 0) {
          this.userSockets.delete(user.id);
          await this.updateUserStatus(user.id, user.type, false);
          this.broadcastUserStatusUpdate(user.id, user.type, false);
        }
      }

      // Remove user from connected users
      this.connectedUsers.delete(socket.id);
    }
  }

  async updateUserStatus(userId, userType, isOnline, socketId = null) {
    try {
      // Map user roles to database enum values
      const dbUserType = userType === "member" ? "client" : userType;

      if (isOnline) {
        await db.execute(
          `INSERT INTO user_status (user_id, user_type, is_online, socket_id, last_seen) 
           VALUES (?, ?, ?, ?, NOW()) 
           ON DUPLICATE KEY UPDATE 
           is_online = ?, socket_id = ?, updated_at = NOW()`,
          [userId, dbUserType, isOnline, socketId, isOnline, socketId]
        );
      } else {
        await db.execute(
          `UPDATE user_status 
           SET is_online = ?, socket_id = NULL, last_seen = NOW(), updated_at = NOW() 
           WHERE user_id = ?`,
          [isOnline, userId]
        );
      }
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  }

  broadcastUserStatusUpdate(userId, userType, isOnline) {
    // Broadcast to all connected users that this user's status changed
    this.io.emit("user_status_changed", {
      userId,
      userType,
      isOnline,
      timestamp: new Date().toISOString(),
    });
  }

  // Method to send message to specific user
  sendToUser(userId, event, data) {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  // Method to send message to specific conversation
  sendToConversation(conversationId, event, data) {
    this.io.to(`conversation_${conversationId}`).emit(event, data);
  }

  // Get online users
  getOnlineUsers() {
    const onlineUsers = {};
    this.userSockets.forEach((sockets, userId) => {
      if (sockets.size > 0) {
        const user = [...this.connectedUsers.values()].find(
          (u) => u.id === userId
        );
        if (user) {
          onlineUsers[userId] = {
            id: user.id,
            type: user.type,
            name: `${user.firstName} ${user.lastName}`,
            socketsCount: sockets.size,
          };
        }
      }
    });
    return onlineUsers;
  }

  // Get user's online status
  isUserOnline(userId) {
    return (
      this.userSockets.has(userId) && this.userSockets.get(userId).size > 0
    );
  }
}

module.exports = SocketHandler;
