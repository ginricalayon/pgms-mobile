const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/rate-details", authMiddleware, paymentController.getRateDetails);
router.get(
  "/trainer-details",
  authMiddleware,
  paymentController.getTrainerDetails
);
router.get("/trainer-rate", authMiddleware, paymentController.getTrainerRate);
router.get(
  "/schedules-details",
  authMiddleware,
  paymentController.getSchedulesDetails
);
router.put(
  "/renew-membership",
  authMiddleware,
  paymentController.renewMembership
);
router.post(
  "/insert-into-transaction",
  authMiddleware,
  paymentController.insertIntoTransaction
);
router.post(
  "/insert-into-member-schedule",
  authMiddleware,
  paymentController.insertIntoMemberSchedule
);
router.put(
  "/update-pt-schedule-availability",
  authMiddleware,
  paymentController.updatePtScheduleAvailability
);

module.exports = router;
