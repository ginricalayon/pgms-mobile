const db = require("../config/database");

exports.getRateDetails = async (req, res) => {
  const { rateId } = req.query;

  try {
    const [rows] = await db.execute(
      "SELECT gr.rateId, gr.name, gr.cost, gr.validityId, v.validity FROM gym_rates gr JOIN rate_validity v ON gr.validityId = v.validityId WHERE gr.rateId = ?",
      [rateId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Rate not found",
      });
    }

    res.status(200).json({
      success: true,
      rate: rows[0],
    });
  } catch (error) {
    console.error("Rate details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rate details",
    });
  }
};

exports.getTrainerDetails = async (req, res) => {
  const { trainerId } = req.query;

  try {
    if (!trainerId) {
      return res.status(400).json({
        success: false,
        message: "trainerId parameter is required",
      });
    }

    const [rows] = await db.execute(
      "SELECT ptId, firstName, lastName, phoneNumber FROM pt_info WHERE ptId = ?",
      [trainerId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found",
      });
    }

    res.status(200).json({
      success: true,
      trainer: rows[0],
    });
  } catch (error) {
    console.error("Trainer details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trainer details",
    });
  }
};

exports.getTrainerRate = async (req, res) => {
  const { ptRateId } = req.query;

  try {
    const [rows] = await db.execute(
      "SELECT ptRateId, amount FROM pt_rate WHERE ptRateId = ?",
      [ptRateId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Trainer rate not found",
      });
    }

    res.status(200).json({
      success: true,
      trainerRate: rows[0],
    });
  } catch (error) {
    console.error("Trainer rate error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trainer rate",
    });
  }
};

exports.getSchedulesDetails = async (req, res) => {
  const { scheduleIds } = req.query;

  try {
    if (!scheduleIds) {
      return res.status(400).json({
        success: false,
        message: "scheduleIds parameter is required",
      });
    }

    const idArray = scheduleIds.split(",").map((id) => id.trim());

    if (idArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid schedule IDs provided",
      });
    }

    const placeholders = idArray.map(() => "?").join(",");

    const [rows] = await db.execute(
      `SELECT ptScheduleId, scheduleDate, startTime, endTime FROM pt_schedule WHERE ptScheduleId IN (${placeholders})`,
      idArray
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Schedules not found",
      });
    }

    res.status(200).json({
      success: true,
      schedules: rows,
    });
  } catch (error) {
    console.error("Schedules details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch schedules details",
    });
  }
};

exports.renewMembership = async (req, res) => {
  const { rateId, trainerId, endDate } = req.body;
  const membershipId = req.user.membershipId;

  if (!rateId || !endDate || !membershipId) {
    return res.status(400).json({
      success: false,
      message: "Missing required parameters",
    });
  }

  const finalTrainerId = trainerId || 0;

  try {
    let formattedEndDate;
    try {
      const date = new Date(endDate);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }
      formattedEndDate = date.toISOString().split("T")[0];
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid end date format",
      });
    }

    const [rows] = await db.execute(
      "UPDATE membership SET rateId = ?, ptId = ?, start = NOW(), end = ?, status = 'Active', cancelled_date = NULL, isFreeze = 0 WHERE membershipId = ?",
      [rateId, finalTrainerId, formattedEndDate, membershipId]
    );

    if (rows.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Membership renewed successfully",
    });
  } catch (error) {
    console.error("Renew membership error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to renew membership",
    });
  }
};

exports.insertIntoTransaction = async (req, res) => {
  const { rateId, totalAmount } = req.body;
  const customerId = req.user.customerId;
  const firstName = req.user.firstName;
  const lastName = req.user.lastName;

  const [rateRows] = await db.execute(
    "SELECT name, cost FROM gym_rates WHERE rateId = ?",
    [rateId]
  );

  const rateName = rateRows[0].name;
  const rateAmount = rateRows[0].cost;

  const [vatRows] = await db.execute("SELECT rate FROM vat");

  const vatRate = vatRows[0].rate;

  try {
    const [rows] = await db.execute(
      "INSERT INTO transaction (customerId, firstName, lastName, rateName, rateAmount, paymentType, vatRate, totalCost, date) VALUES (?, ?, ?, ?, ?, 'Renew Membership', ?, ?, NOW())",
      [
        customerId,
        firstName,
        lastName,
        rateName,
        rateAmount,
        vatRate,
        totalAmount,
      ]
    );

    res.status(200).json({
      success: true,
      message: "Payment successful",
    });
  } catch (error) {
    console.error("Insert into transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to insert into transaction",
    });
  }
};

exports.insertIntoMemberSchedule = async (req, res) => {
  const { trainerId, scheduleIds } = req.body;
  const membershipId = req.user.membershipId;

  try {
    const idArray = scheduleIds.split(",").map((id) => id.trim());

    if (idArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid schedule IDs provided",
      });
    }

    const placeholders = idArray.map(() => "(?, ?, ?)").join(",");
    const params = [];

    idArray.forEach((scheduleId) => {
      params.push(membershipId, trainerId, scheduleId);
    });

    const [rows] = await db.execute(
      `INSERT INTO member_schedule (memberId, ptId, ptScheduleId) VALUES ${placeholders}`,
      params
    );

    if (rows.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Member schedule not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Member schedule inserted successfully",
    });
  } catch (error) {
    console.error("Insert into member schedule error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to insert into member schedule",
    });
  }
};

exports.updatePtScheduleAvailability = async (req, res) => {
  const { scheduleIds, trainerId } = req.body;

  try {
    const idArray = scheduleIds.split(",").map((id) => id.trim());

    if (idArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid schedule IDs provided",
      });
    }

    const placeholders = idArray.map(() => "?").join(",");
    const params = [...idArray];

    const [rows] = await db.execute(
      `UPDATE pt_schedule SET isAvailable = 0 WHERE ptScheduleId IN (${placeholders})`,
      params
    );

    if (rows.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Pt schedule not found",
      });
    }

    const [checkResult] = await db.execute(
      "SELECT COUNT(*) as availableCount FROM pt_schedule WHERE ptId = ? AND isAvailable = 1",
      [trainerId]
    );

    const availableCount = checkResult[0].availableCount;

    if (availableCount === 0) {
      await db.execute(
        "UPDATE personal_trainer SET isAvailable = 0 WHERE ptId = ?",
        [trainerId]
      );
    }

    return res.status(200).json({
      success: true,
      message: "Schedule and trainer availability updated successfully",
    });
  } catch (error) {
    console.error("Update pt schedule availability error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update pt schedule availability",
    });
  }
};
