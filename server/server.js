const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./config/database");
const { checkTables } = require("./config/checkDb");

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

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/member", memberRoutes);

// Basic route for testing
app.get("/", (req, res) => {
  res.json({ message: "Welcome to PGMS API" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  // Test database connection when server starts
  await testDBConnection();
});
