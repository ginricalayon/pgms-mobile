const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const db = require("./config/database");
const { checkTables } = require("./config/checkDb");
const SocketHandler = require("./websocket/socketHandler");

// Test database connection
async function testDBConnection() {
  try {
    const [result] = await db.execute("SELECT 1");
    console.log("Database connection successful!");
    // Check tables after successful connection
    await checkTables();
    return true;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    return false;
  }
}

// Import routes
const authRoutes = require("./routes/authRoutes");
const memberRoutes = require("./routes/memberRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const trainerRoutes = require("./routes/trainerRoutes");
const messageRoutes = require("./routes/messageRoutes");

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS settings
const io = new Server(server, {
  cors: {
    origin: "*", // Configure this to your frontend domain in production
    methods: ["GET", "POST"],
  },
});

// Initialize Socket Handler
const socketHandler = new SocketHandler(io);

// Make io available to routes
app.set("io", io);
app.set("socketHandler", socketHandler);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, "..")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/member", memberRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/trainer", trainerRoutes);
app.use("/api/messages", messageRoutes);

// Basic route for testing
app.get("/", (req, res) => {
  res.json({ message: "Welcome to PGMS API with Real-time Chat" });
});

// WebSocket status endpoint
app.get("/api/socket/status", (req, res) => {
  const socketHandler = app.get("socketHandler");
  res.json({
    connectedUsers: socketHandler.getOnlineUsers(),
    totalConnections: Object.keys(socketHandler.getOnlineUsers()).length,
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket server is ready for connections`);
  // Test database connection when server starts
  await testDBConnection();
});
