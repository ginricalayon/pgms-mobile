import { API_URL } from "./config/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";

class MessageService {
  private socket: Socket | null = null;
  private conversationListeners = new Set<
    (conversations: Conversation[]) => void
  >();
  private messageListeners = new Map<string, Set<(message: Message) => void>>();
  private messageReadListeners = new Map<string, Set<(data: any) => void>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isAuthenticated = false;
  private isConnected = false;

  // Get all conversations for current user (trainer or client)
  async getConversations(): Promise<Conversation[]> {
    try {
      const token = await AsyncStorage.getItem("pgms_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_URL}/api/messages/conversations`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
      });

      // Get response text first for better error handling
      const responseText = await response.text();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please login again.");
        }
        throw new Error(`Server error: ${response.status}`);
      }

      // Parse JSON with error handling
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error("Invalid response format from server");
      }

      return data || [];
    } catch (error: any) {
      // For network errors, return mock data to keep app functional
      if (
        error.message?.includes("Network request failed") ||
        error.message?.includes("fetch")
      ) {
        return this.getMockConversations();
      }
      throw error;
    }
  }

  // Get messages for a specific conversation
  async getMessages(clientId: string): Promise<Message[]> {
    try {
      const token = await AsyncStorage.getItem("pgms_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_URL}/api/messages/${clientId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please login again.");
        }
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error: any) {
      // For network errors, return mock data to keep app functional
      if (
        error.message?.includes("Network request failed") ||
        error.message?.includes("fetch")
      ) {
        return this.getMockMessages(clientId);
      }
      throw error;
    }
  }

  // Send a new message
  async sendMessage(recipientId: string, content: string): Promise<Message> {
    try {
      const token = await AsyncStorage.getItem("pgms_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_URL}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({
          recipientId,
          content,
        }),
      });

      // Get response text first for better error handling
      const responseText = await response.text();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please login again.");
        }

        // Try to parse error message from response
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(
            errorData.message ||
              `Failed to send message: ${response.statusText}`
          );
        } catch (parseError) {
          throw new Error(`Failed to send message`);
        }
      }

      // Parse the successful response
      try {
        const data = JSON.parse(responseText);
        return data;
      } catch (parseError) {
        throw new Error("Server returned invalid response format");
      }
    } catch (error: any) {
      throw error;
    }
  }

  // Get client info
  async getClientInfo(clientId: string): Promise<ClientInfo> {
    try {
      const token = await AsyncStorage.getItem("pgms_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_URL}/api/messages/user/${clientId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please login again.");
        }
        throw new Error(`Failed to fetch client info: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      // For network errors, return mock data to keep app functional
      if (
        error.message?.includes("Network request failed") ||
        error.message?.includes("fetch")
      ) {
        return this.getMockClientInfo(clientId);
      }
      throw error;
    }
  }

  // Subscribe to real-time conversation updates
  subscribeToConversations(
    callback: (conversations: Conversation[]) => void
  ): () => void {
    this.conversationListeners.add(callback);

    // Initialize Socket.IO connection for conversations
    this.initializeSocket();

    return () => {
      this.conversationListeners.delete(callback);
      if (
        this.conversationListeners.size === 0 &&
        this.messageListeners.size === 0
      ) {
        this.closeSocket();
      }
    };
  }

  // Subscribe to real-time messages for a specific client
  subscribeToMessages(
    clientId: string,
    callback: (message: Message) => void
  ): () => void {
    if (!this.messageListeners.has(clientId)) {
      this.messageListeners.set(clientId, new Set());
    }
    this.messageListeners.get(clientId)!.add(callback);

    // Initialize Socket.IO connection
    this.initializeSocket();

    return () => {
      const listeners = this.messageListeners.get(clientId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.messageListeners.delete(clientId);
        }
      }

      if (
        this.conversationListeners.size === 0 &&
        this.messageListeners.size === 0 &&
        this.messageReadListeners.size === 0
      ) {
        this.closeSocket();
      }
    };
  }

  // Subscribe to messages with refresh callback for read status
  subscribeToMessagesWithRefresh(
    clientId: string,
    messageCallback: (message: Message) => void,
    refreshCallback: () => void
  ): () => void {
    if (!this.messageListeners.has(clientId)) {
      this.messageListeners.set(clientId, new Set());
    }
    this.messageListeners.get(clientId)!.add(messageCallback);

    if (!this.messageReadListeners.has(clientId)) {
      this.messageReadListeners.set(clientId, new Set());
    }

    // Add a read status listener that calls the refresh callback
    const readStatusCallback = (data: any) => {
      refreshCallback();
    };

    this.messageReadListeners.get(clientId)!.add(readStatusCallback);

    // Initialize Socket.IO connection
    this.initializeSocket();

    return () => {
      const listeners = this.messageListeners.get(clientId);
      if (listeners) {
        listeners.delete(messageCallback);
        if (listeners.size === 0) {
          this.messageListeners.delete(clientId);
        }
      }

      const readListeners = this.messageReadListeners.get(clientId);
      if (readListeners) {
        readListeners.delete(readStatusCallback);
        if (readListeners.size === 0) {
          this.messageReadListeners.delete(clientId);
        }
      }

      if (
        this.conversationListeners.size === 0 &&
        this.messageListeners.size === 0 &&
        this.messageReadListeners.size === 0
      ) {
        this.closeSocket();
      }
    };
  }

  // Initialize Socket.IO connection
  private async initializeSocket(): Promise<void> {
    if (this.socket && this.socket.connected) {
      return;
    }

    try {
      // Close existing connection if any
      if (this.socket) {
        this.socket.disconnect();
      }

      // Get authentication token
      const token = await AsyncStorage.getItem("pgms_token");
      if (!token) {
        console.error("No authentication token found for socket connection");
        return;
      }

      // Create Socket.IO connection with authentication
      this.socket = io(API_URL, {
        auth: {
          token: token,
        },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 20000,
      });

      // Set up Socket.IO event listeners
      this.socket.on("connect", () => {
        this.isConnected = true;

        // Authenticate with server - send just the token string
        this.socket?.emit("authenticate", token);
      });

      this.socket.on("authenticated", () => {
        this.isAuthenticated = true;
      });

      this.socket.on("authentication_error", (error) => {
        this.isAuthenticated = false;
      });

      this.socket.on("disconnect", (reason) => {
        this.isConnected = false;
      });

      this.socket.on("new_message", (data) => {
        if (data.clientId && data.message) {
          // Ensure clientId is a string for consistency
          const clientIdStr = String(data.clientId);
          this.notifyMessageListeners(clientIdStr, data.message);
        } else {
          console.warn("⚠️ Invalid new_message data:", data);
        }
      });

      this.socket.on("conversation_update", () => {
        this.notifyConversationUpdate();
      });

      this.socket.on("conversation_deleted", (data: any) => {
        this.notifyConversationUpdate();

        const deletedClientId = data.clientId || data.trainerId;
        if (deletedClientId && this.messageListeners.has(deletedClientId)) {
          this.messageListeners.delete(deletedClientId);
        }
      });

      this.socket.on("messages_read", (data: any) => {
        this.notifyConversationUpdate();
        this.notifyReadStatusListeners(data);
      });

      this.socket.on("user_status_changed", () => {
        this.notifyConversationUpdate();
      });

      this.socket.on("connect_error", (error) => {
        this.reconnectAttempts++;
      });
    } catch (error) {
      console.error("Error initializing Socket.IO:", error);
    }
  }

  // Notify message listeners
  private notifyMessageListeners(clientId: string, message: Message): void {
    const listeners = this.messageListeners.get(clientId);

    if (listeners && listeners.size > 0) {
      let index = 0;
      listeners.forEach((callback) => {
        index++;
        try {
          callback(message);
        } catch (error) {
          console.error("Error calling listener", index, ":", error);
        }
      });
    } else {
      console.log("No listeners found for clientId:", clientId);
    }
  }

  // Notify conversation listeners to refresh
  private async notifyConversationUpdate(): Promise<void> {
    if (this.conversationListeners.size > 0) {
      try {
        const conversations = await this.getConversations();
        this.conversationListeners.forEach((callback) =>
          callback(conversations)
        );
      } catch (error) {
        console.error("Error refreshing conversations:", error);
      }
    }
  }

  // Notify read status listeners
  private notifyReadStatusListeners(data: any): void {
    const listeners = this.messageReadListeners.get(data.clientId);

    if (listeners && listeners.size > 0) {
      let index = 0;
      listeners.forEach((callback) => {
        index++;
        try {
          callback(data);
        } catch (error) {
          console.error("Error calling listener", index, ":", error);
        }
      });
    } else {
      console.log("No listeners found for clientId:", data.clientId);
    }
  }

  // Close Socket.IO connection
  private closeSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isAuthenticated = false;
    }
  }

  // Mock data for development
  private getMockConversations(): Conversation[] {
    return [
      {
        id: "1",
        clientId: "client_1",
        clientName: "John Doe",
        lastMessage: "Thank you for the workout plan!",
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        unreadCount: 2,
        isOnline: true,
      },
      {
        id: "2",
        clientId: "client_2",
        clientName: "Jane Smith",
        lastMessage: "When is our next session?",
        lastMessageTime: new Date(
          Date.now() - 1000 * 60 * 60 * 2
        ).toISOString(), // 2 hours ago
        unreadCount: 0,
        isOnline: false,
      },
      {
        id: "3",
        clientId: "client_3",
        clientName: "Mike Johnson",
        lastMessage: "Great session today!",
        lastMessageTime: new Date(
          Date.now() - 1000 * 60 * 60 * 24
        ).toISOString(), // 1 day ago
        unreadCount: 1,
        isOnline: true,
      },
    ];
  }

  private getMockMessages(clientId: string): Message[] {
    const baseMessages = [
      {
        id: "1",
        senderId: clientId,
        senderName: "John Doe",
        senderType: "client" as const,
        content: "Hi! I wanted to ask about the workout plan.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        isRead: true,
      },
      {
        id: "2",
        senderId: "trainer_1",
        senderName: "Trainer Mike",
        senderType: "trainer" as const,
        content:
          "Hello! Sure, I'd be happy to help. What would you like to know?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        isRead: true,
      },
      {
        id: "3",
        senderId: clientId,
        senderName: "John Doe",
        senderType: "client" as const,
        content: "Thank you for the workout plan!",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        isRead: false,
      },
    ];

    return baseMessages;
  }

  private getMockClientInfo(clientId: string): ClientInfo {
    return {
      id: clientId,
      name: "John Doe",
      isOnline: true,
      lastSeen: "2 minutes ago",
    };
  }

  // Test authentication and API connectivity
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    token?: string;
  }> {
    try {
      const token = await AsyncStorage.getItem("pgms_token");

      if (!token) {
        return { success: false, message: "No authentication token found" };
      }

      const response = await fetch(`${API_URL}/api/messages/conversations`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
      });

      const responseText = await response.text();

      if (response.ok) {
        return {
          success: true,
          message: "Connection successful!",
          token: token.substring(0, 20) + "...",
        };
      } else {
        return {
          success: false,
          message: `Server error: ${response.status} - ${responseText}`,
          token: token.substring(0, 20) + "...",
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Network error: ${
          error instanceof Error ? error.message : "Unknown"
        }`,
      };
    }
  }
}

export const messageService = new MessageService();
