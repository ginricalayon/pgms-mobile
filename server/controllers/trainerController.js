const db = require("../config/database");

// Get trainer dashboard data
exports.getDashboard = async (req, res) => {
  try {
    const ptId = req.user.customerId;

    const [statsRows] = await db.execute(
      `SELECT 
        COUNT(DISTINCT m.membershipId) as totalClients,
        COUNT(CASE WHEN pts.scheduleDate = DAYNAME(CURDATE()) AND ms.memberScheduleId IS NOT NULL THEN 1 END) as sessionsToday,
        COUNT(CASE WHEN ms.memberScheduleId IS NOT NULL THEN 1 END) as upcomingSessions,
        COUNT(CASE WHEN pts.isAvailable = 1 AND ms.memberScheduleId IS NULL THEN 1 END) as availableSessions
       FROM pt_info t
       LEFT JOIN membership m ON t.ptId = m.ptId
       LEFT JOIN pt_schedule pts ON t.ptId = pts.ptId
       LEFT JOIN member_schedule ms ON pts.ptScheduleId = ms.ptScheduleId
       WHERE t.ptId = ?`,
      [ptId]
    );

    const stats = {
      totalClients: statsRows[0].totalClients || 0,
      sessionsToday: statsRows[0].sessionsToday || 0,
      upcomingSessions: statsRows[0].upcomingSessions || 0,
      availableSessions: statsRows[0].availableSessions || 0,
    };

    res.status(200).json({
      success: true,
      stats: stats,
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard data",
    });
  }
};

// Get trainer profile
exports.getProfile = async (req, res) => {
  try {
    const ptId = req.user.customerId;

    const [rows] = await db.execute(
      "SELECT ptId, firstName, lastName, gender, address, birthdate, phoneNumber FROM pt_info WHERE ptId = ?",
      [ptId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Trainer profile not found",
      });
    }

    res.status(200).json({
      success: true,
      profile: rows[0],
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};

// Update trainer profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, gender, address, phoneNumber, birthdate } =
      req.body;

    const ptId = req.user.customerId;

    if (
      !firstName ||
      !lastName ||
      !gender ||
      !birthdate ||
      !address ||
      !phoneNumber
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!/^09\d{9}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must start with '09' and be exactly 11 digits",
      });
    }

    // Validate birthdate
    const birthDate = new Date(birthdate);
    birthDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    const today = new Date();
    const minAge = 16;
    const maxAge = 59;
    const minDateAllowed = new Date(
      today.getFullYear() - minAge,
      today.getMonth(),
      today.getDate()
    );
    const maxDateAllowed = new Date(
      today.getFullYear() - maxAge,
      today.getMonth(),
      today.getDate()
    );

    if (birthDate > today) {
      return res.status(400).json({
        success: false,
        message: "Birthdate cannot be in the future",
      });
    }

    if (birthDate > minDateAllowed) {
      return res.status(400).json({
        success: false,
        message: `You must be at least ${minAge} years old`,
      });
    }

    if (birthDate < maxDateAllowed) {
      return res.status(400).json({
        success: false,
        message: `You cannot be older than ${maxAge} years old`,
      });
    }

    // Format date to YYYY-MM-DD for MySQL
    const formattedBirthdate = birthDate.toISOString().split("T")[0];

    const checkPhoneQuery =
      "SELECT ptId FROM pt_info WHERE phoneNumber = ? AND ptId != ?";
    const [existingPhone] = await db.query(checkPhoneQuery, [
      phoneNumber,
      ptId,
    ]);

    if (existingPhone.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists",
      });
    }

    const updateQuery = `
      UPDATE pt_info 
      SET firstName = ?,
          lastName = ?,
          gender = ?,
          birthdate = ?,
          address = ?,
          phoneNumber = ?
      WHERE ptId = ?
    `;

    const [result] = await db.query(updateQuery, [
      firstName,
      lastName,
      gender,
      formattedBirthdate,
      address,
      phoneNumber,
      ptId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found",
      });
    }

    const [updatedTrainer] = await db.query(
      "SELECT ptId, firstName, lastName, gender, birthdate, address, phoneNumber FROM pt_info WHERE ptId = ?",
      [ptId]
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedTrainer[0],
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
    });
  }
};

// Get trainer's clients
exports.getClients = async (req, res) => {
  try {
    const ptId = req.user.customerId;

    const [rows] = await db.execute(
      `SELECT m.membershipId, c.firstName, c.lastName, c.gender, c.phoneNumber, m.start, m.end, m.status
       FROM membership m
       JOIN customer c ON m.customerId = c.customerId
       WHERE m.ptId = ?
       ORDER BY m.start DESC`,
      [ptId]
    );

    res.status(200).json({
      success: true,
      clients: rows,
    });
  } catch (error) {
    console.error("Get clients error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching clients",
    });
  }
};

// Get client details
exports.getClientDetails = async (req, res) => {
  try {
    const ptId = req.user.customerId;
    const { clientId } = req.params;

    // First get client details
    const [clientRows] = await db.execute(
      `SELECT m.membershipId, m.picture, c.firstName, c.lastName, c.gender, c.birthdate, c.address, c.phoneNumber,
              m.start, m.end, m.status, r.name as rateName, r.cost as rateCost
       FROM membership m
       JOIN customer c ON m.customerId = c.customerId
       JOIN gym_rates r ON m.rateId = r.rateId
       WHERE m.ptId = ? AND m.membershipId = ?`,
      [ptId, clientId]
    );

    if (clientRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Client not found or not assigned to this trainer",
      });
    }

    if (clientRows[0].picture) {
      clientRows[0].picture = clientRows[0].picture.toString("base64");
    }

    // Then get all schedules for this client
    const [scheduleRows] = await db.execute(
      `SELECT s.scheduleDate, s.startTime, s.endTime
       FROM pt_schedule s
       JOIN member_schedule ms ON s.ptScheduleId = ms.ptScheduleId
       WHERE ms.memberId = ?
       ORDER BY s.scheduleDate ASC`,
      [clientId]
    );

    // Combine the data
    const clientDetails = {
      ...clientRows[0],
      schedules: scheduleRows,
    };

    res.status(200).json({
      success: true,
      details: clientDetails,
    });
  } catch (error) {
    console.error("Get client details error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching client details",
    });
  }
};

// Change trainer username
exports.changeUsername = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newUsername } = req.body;

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Password is required to verify this change",
      });
    }

    if (!newUsername) {
      return res.status(400).json({
        success: false,
        message: "New username is required",
      });
    }

    if (newUsername.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Username must be at least 6 characters",
      });
    }

    const hasLetter = /[a-zA-Z]/.test(newUsername);
    if (!hasLetter) {
      return res.status(400).json({
        success: false,
        message: "Username must include at least one letter",
      });
    }

    const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(newUsername);
    if (!isAlphanumeric) {
      return res.status(400).json({
        success: false,
        message: "Username must contain only letters and numbers",
      });
    }

    const [user] = await db.execute(
      "SELECT password, username FROM member_account WHERE id = ?",
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user[0].password !== currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Password is incorrect",
      });
    }

    if (user[0].username === newUsername) {
      return res.status(400).json({
        success: false,
        message: "New username must be different from current username",
      });
    }

    // Check if username is already taken
    const [existingUsername] = await db.execute(
      "SELECT id FROM member_account WHERE username = ? AND id != ?",
      [newUsername, userId]
    );

    if (existingUsername.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Username is already taken",
      });
    }

    // Update username
    const updateQuery = `
      UPDATE member_account 
      SET username = ?
      WHERE id = ?
    `;

    const [result] = await db.query(updateQuery, [newUsername, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Failed to update username",
      });
    }

    res.status(200).json({
      success: true,
      message: "Username updated successfully",
    });
  } catch (error) {
    console.log("Change username error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while changing username",
    });
  }
};

// Change trainer password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      newPassword
    );

    if (!hasUpperCase) {
      return res.status(400).json({
        success: false,
        message: "Password must include at least one uppercase letter",
      });
    }

    if (!hasLowerCase) {
      return res.status(400).json({
        success: false,
        message: "Password must include at least one lowercase letter",
      });
    }

    if (!hasNumber) {
      return res.status(400).json({
        success: false,
        message: "Password must include at least one number",
      });
    }

    if (!hasSpecialChar) {
      return res.status(400).json({
        success: false,
        message: "Password must include at least one special character",
      });
    }

    const [user] = await db.execute(
      "SELECT password FROM member_account WHERE id = ?",
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user[0].password !== currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as current password",
      });
    }

    const updateQuery = `
      UPDATE member_account 
      SET password = ?
      WHERE id = ?
    `;

    const [result] = await db.query(updateQuery, [newPassword, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Failed to update password",
      });
    }

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.log("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while changing password",
    });
  }
};

// Get trainer schedules
exports.getSchedules = async (req, res) => {
  try {
    const ptId = req.user.customerId;

    const query = `
      SELECT 
        pts.ptScheduleId, 
        pts.ptId,
        pts.scheduleDate, 
        pts.startTime, 
        pts.endTime,
        pts.isAvailable,
        CASE 
          WHEN ms.memberScheduleId IS NOT NULL THEN CONCAT(c.firstName, ' ', c.lastName) 
          ELSE NULL 
        END as clientName
      FROM pt_schedule pts
      LEFT JOIN member_schedule ms ON pts.ptScheduleId = ms.ptScheduleId
      LEFT JOIN membership m ON ms.memberId = m.membershipId
      LEFT JOIN customer c ON m.customerId = c.customerId
      WHERE pts.ptId = ?
      ORDER BY pts.scheduleDate, pts.startTime
    `;

    const [rows] = await db.execute(query, [ptId]);

    // Transform the data to match frontend expectations
    const schedules = rows.map((row) => ({
      ptScheduleId: row.ptScheduleId.toString(),
      ptId: row.ptId,
      scheduleDate: row.scheduleDate,
      startTime: row.startTime,
      endTime: row.endTime,
      isAvailable: Boolean(row.isAvailable),
      clientName: row.clientName,
    }));

    res.status(200).json({
      success: true,
      schedules: schedules,
    });
  } catch (error) {
    console.error("Get schedules error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching schedules",
    });
  }
};

// Helper function to update trainer availability based on schedule slots
const updateTrainerAvailability = async (ptId) => {
  try {
    // Count available schedule slots for this trainer
    const [countResult] = await db.execute(
      "SELECT COUNT(*) as availableCount FROM pt_schedule WHERE ptId = ? AND isAvailable = 1",
      [ptId]
    );

    const availableCount = countResult[0].availableCount;

    // Update trainer availability based on available schedule count
    const isAvailable = availableCount > 0 ? 1 : 0;

    await db.execute(
      "UPDATE personal_trainer SET isAvailable = ? WHERE ptId = ?",
      [isAvailable, ptId]
    );
  } catch (error) {
    console.error("Error updating trainer availability:", error);
  }
};

// Create multiple schedule slots
exports.createSchedules = async (req, res) => {
  try {
    const ptId = req.user.customerId;
    const { startTime, endTime, selectedDays } = req.body;

    // Validate input
    if (
      !startTime ||
      !endTime ||
      !selectedDays ||
      !Array.isArray(selectedDays) ||
      selectedDays.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Start time, end time, and at least one day are required",
      });
    }

    // Check for existing schedule conflicts
    const conflictQuery = `
      SELECT scheduleDate, startTime, endTime 
      FROM pt_schedule 
      WHERE ptId = ? AND scheduleDate IN (${selectedDays
        .map(() => "?")
        .join(",")}) 
      AND (
        (STR_TO_DATE(startTime, '%h:%i %p') <= STR_TO_DATE(?, '%h:%i %p') AND STR_TO_DATE(endTime, '%h:%i %p') > STR_TO_DATE(?, '%h:%i %p')) OR
        (STR_TO_DATE(startTime, '%h:%i %p') < STR_TO_DATE(?, '%h:%i %p') AND STR_TO_DATE(endTime, '%h:%i %p') >= STR_TO_DATE(?, '%h:%i %p')) OR
        (STR_TO_DATE(startTime, '%h:%i %p') >= STR_TO_DATE(?, '%h:%i %p') AND STR_TO_DATE(endTime, '%h:%i %p') <= STR_TO_DATE(?, '%h:%i %p'))
      )
    `;

    const conflictParams = [
      ptId,
      ...selectedDays,
      startTime,
      startTime, // Check if existing schedule starts before/at new start and ends after new start
      endTime,
      endTime, // Check if existing schedule starts before new end and ends at/after new end
      startTime,
      endTime, // Check if existing schedule is completely within new schedule
    ];

    const [existingSchedules] = await db.execute(conflictQuery, conflictParams);

    if (existingSchedules.length > 0) {
      const conflictDetails = existingSchedules.map(
        (schedule) =>
          `${schedule.scheduleDate} ${schedule.startTime}-${schedule.endTime}`
      );
      return res.status(409).json({
        success: false,
        message: `Schedule conflicts with existing schedules: ${conflictDetails.join(
          ", "
        )}`,
      });
    }

    // Create schedule entries for each selected day (no conflicts found)
    const schedulePromises = selectedDays.map(async (day) => {
      const query = `
        INSERT INTO pt_schedule (ptId, scheduleDate, startTime, endTime, isAvailable)
        VALUES (?, ?, ?, ?, 1)
      `;

      return db.execute(query, [ptId, day, startTime, endTime]);
    });

    // Execute all insertions
    await Promise.all(schedulePromises);

    // Update trainer availability
    await updateTrainerAvailability(ptId);

    res.status(201).json({
      success: true,
      message: `Successfully created ${selectedDays.length} schedule slots`,
      data: {
        count: selectedDays.length,
        days: selectedDays,
        startTime,
        endTime,
      },
    });
  } catch (error) {
    console.error("Create schedules error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating schedules",
    });
  }
};

// Delete schedule slot
exports.deleteSchedule = async (req, res) => {
  try {
    const ptId = req.user.customerId;
    const { scheduleId } = req.params;

    if (!scheduleId) {
      return res.status(400).json({
        success: false,
        message: "Schedule ID is required",
      });
    }

    // First check if the schedule exists and belongs to this trainer
    const [scheduleRows] = await db.execute(
      "SELECT ptScheduleId, ptId, isAvailable FROM pt_schedule WHERE ptScheduleId = ? AND ptId = ?",
      [scheduleId, ptId]
    );

    if (scheduleRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found or does not belong to this trainer",
      });
    }

    // Check if the schedule is currently booked (not available)
    if (!scheduleRows[0].isAvailable) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete a booked schedule. Please contact an admin if you need to cancel a booked session.",
      });
    }

    // Delete the schedule
    const [deleteResult] = await db.execute(
      "DELETE FROM pt_schedule WHERE ptScheduleId = ? AND ptId = ?",
      [scheduleId, ptId]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Failed to delete schedule",
      });
    }

    // Update trainer availability after deleting schedule
    await updateTrainerAvailability(ptId);

    res.status(200).json({
      success: true,
      message: "Schedule deleted successfully",
    });
  } catch (error) {
    console.error("Delete schedule error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting schedule",
    });
  }
};

// Update schedule slot
exports.updateSchedule = async (req, res) => {
  try {
    const ptId = req.user.customerId;
    const { scheduleId } = req.params;
    const { startTime, endTime, scheduleDate } = req.body;

    if (!scheduleId) {
      return res.status(400).json({
        success: false,
        message: "Schedule ID is required",
      });
    }

    // Validate input
    if (!startTime || !endTime || !scheduleDate) {
      return res.status(400).json({
        success: false,
        message: "Start time, end time, and schedule date are required",
      });
    }

    // First check if the schedule exists and belongs to this trainer
    const [scheduleRows] = await db.execute(
      "SELECT ptScheduleId, ptId, isAvailable, scheduleDate, startTime, endTime FROM pt_schedule WHERE ptScheduleId = ? AND ptId = ?",
      [scheduleId, ptId]
    );

    if (scheduleRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found or does not belong to this trainer",
      });
    }

    // Check if the schedule is currently booked (not available)
    if (!scheduleRows[0].isAvailable) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot update a booked schedule. Please contact an admin if you need to modify a booked session.",
      });
    }

    // Check for existing schedule conflicts (excluding the current schedule being updated)
    const conflictQuery = `
      SELECT scheduleDate, startTime, endTime 
      FROM pt_schedule 
      WHERE ptId = ? AND scheduleDate = ? AND ptScheduleId != ?
      AND (
        (STR_TO_DATE(startTime, '%h:%i %p') <= STR_TO_DATE(?, '%h:%i %p') AND STR_TO_DATE(endTime, '%h:%i %p') > STR_TO_DATE(?, '%h:%i %p')) OR
        (STR_TO_DATE(startTime, '%h:%i %p') < STR_TO_DATE(?, '%h:%i %p') AND STR_TO_DATE(endTime, '%h:%i %p') >= STR_TO_DATE(?, '%h:%i %p')) OR
        (STR_TO_DATE(startTime, '%h:%i %p') >= STR_TO_DATE(?, '%h:%i %p') AND STR_TO_DATE(endTime, '%h:%i %p') <= STR_TO_DATE(?, '%h:%i %p'))
      )
    `;

    const conflictParams = [
      ptId,
      scheduleDate,
      scheduleId, // Exclude current schedule from conflict check
      startTime,
      startTime, // Check if existing schedule starts before/at new start and ends after new start
      endTime,
      endTime, // Check if existing schedule starts before new end and ends at/after new end
      startTime,
      endTime, // Check if existing schedule is completely within new schedule
    ];

    const [existingSchedules] = await db.execute(conflictQuery, conflictParams);

    if (existingSchedules.length > 0) {
      const conflictDetails = existingSchedules.map(
        (schedule) =>
          `${schedule.scheduleDate} ${schedule.startTime}-${schedule.endTime}`
      );
      return res.status(409).json({
        success: false,
        message: `Schedule conflicts with existing schedules: ${conflictDetails.join(
          ", "
        )}`,
      });
    }

    // Update the schedule
    const updateQuery = `
      UPDATE pt_schedule 
      SET scheduleDate = ?, startTime = ?, endTime = ?
      WHERE ptScheduleId = ? AND ptId = ?
    `;

    const [updateResult] = await db.execute(updateQuery, [
      scheduleDate,
      startTime,
      endTime,
      scheduleId,
      ptId,
    ]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Failed to update schedule",
      });
    }

    res.status(200).json({
      success: true,
      message: "Schedule updated successfully",
      data: {
        scheduleId,
        scheduleDate,
        startTime,
        endTime,
      },
    });
  } catch (error) {
    console.error("Update schedule error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating schedule",
    });
  }
};
