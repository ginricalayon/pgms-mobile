const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/login", authController.login);
router.get("/me", authMiddleware, authController.getCurrentUser);
router.get("/verify", authMiddleware, authController.verifyToken);

module.exports = router;
