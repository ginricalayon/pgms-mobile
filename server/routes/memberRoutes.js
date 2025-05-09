const express = require("express");
const router = express.Router();
const memberController = require("../controllers/memberController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/profile", authMiddleware, memberController.getProfile);
router.get(
  "/membershipDetails",
  authMiddleware,
  memberController.getMembershipDetails
);
router.get("/check-ins", authMiddleware, memberController.getCheckIns);
router.get("/schedules", authMiddleware, memberController.getSchedules);
router.get("/trainerInfo", authMiddleware, memberController.getTrainerInfo);
router.get("/transactions", authMiddleware, memberController.getTransactions);
router.get(
  "/membership-status",
  authMiddleware,
  memberController.getMembershipStatus
);
router.put("/edit-profile", authMiddleware, memberController.editProfile);
router.put("/change-password", authMiddleware, memberController.changePassword);
router.put("/change-username", authMiddleware, memberController.changeUsername);
router.get(
  "/membership-rates",
  authMiddleware,
  memberController.getMembershipRates
);
router.get(
  "/personal-trainer-rate",
  authMiddleware,
  memberController.getPersonalTrainerRates
);
router.get(
  "/available-trainers",
  authMiddleware,
  memberController.getAvailableTrainers
);
router.get(
  "/trainer-available-schedules",
  authMiddleware,
  memberController.getTrainerAvailableSchedules
);

module.exports = router;
