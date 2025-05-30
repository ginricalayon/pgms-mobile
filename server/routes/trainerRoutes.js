const express = require("express");
const router = express.Router();
const trainerController = require("../controllers/trainerController");
const authMiddleware = require("../middleware/authMiddleware");

// Trainer dashboard
router.get("/dashboard", authMiddleware, trainerController.getDashboard);

// // Trainer profile
router.get("/profile", authMiddleware, trainerController.getProfile);
router.put("/profile", authMiddleware, trainerController.updateProfile);

// // Trainer clients
router.get("/clients", authMiddleware, trainerController.getClients);
router.get(
  "/clients/:clientId",
  authMiddleware,
  trainerController.getClientDetails
);

// Change trainer username
router.put(
  "/change-username",
  authMiddleware,
  trainerController.changeUsername
);

// Change trainer password
router.put(
  "/change-password",
  authMiddleware,
  trainerController.changePassword
);

// // Trainer schedules
router.get("/schedules", authMiddleware, trainerController.getSchedules);
router.post("/schedules", authMiddleware, trainerController.createSchedules);
router.put(
  "/schedules/:scheduleId",
  authMiddleware,
  trainerController.updateSchedule
);
router.delete(
  "/schedules/:scheduleId",
  authMiddleware,
  trainerController.deleteSchedule
);
// router.post("/sessions", authMiddleware, trainerController.createSession);
// router.patch("/sessions/:sessionId/status", authMiddleware, trainerController.updateSessionStatus);

// // Trainer availability
// router.get("/availability", authMiddleware, trainerController.getAvailability);
// router.put("/availability", authMiddleware, trainerController.updateAvailability);

// // Trainer statistics
// router.get("/stats/sessions", authMiddleware, trainerController.getSessionStats);

module.exports = router;
