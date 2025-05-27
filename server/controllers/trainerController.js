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
    const ptId = req.user.ptId;
    const { date } = req.query;

    let query = `
      SELECT pts.ptScheduleId, pts.scheduleDate, pts.startTime, pts.endTime,
             c.firstName, c.lastName, m.membershipId
      FROM pt_schedule pts
      LEFT JOIN membership m ON pts.membershipId = m.membershipId
      LEFT JOIN customer c ON m.customerId = c.customerId
      WHERE pts.ptId = ?
    `;

    let params = [ptId];

    if (date) {
      query += " AND DATE(pts.scheduleDate) = ?";
      params.push(date);
    }

    query += " ORDER BY pts.scheduleDate, pts.startTime";

    const [rows] = await db.execute(query, params);

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Get schedules error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching schedules",
    });
  }
};

// Create a new training session
exports.createSession = async (req, res) => {
  try {
    const ptId = req.user.ptId;
    const { membershipId, scheduleDate, startTime, endTime } = req.body;

    const [result] = await db.execute(
      "INSERT INTO pt_schedule (ptId, membershipId, scheduleDate, startTime, endTime) VALUES (?, ?, ?, ?, ?)",
      [ptId, membershipId, scheduleDate, startTime, endTime]
    );

    res.status(201).json({
      success: true,
      message: "Training session created successfully",
      data: { ptScheduleId: result.insertId },
    });
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating session",
    });
  }
};

// Update session status (if you have a status column)
exports.updateSessionStatus = async (req, res) => {
  try {
    const ptId = req.user.ptId;
    const { sessionId } = req.params;
    const { status } = req.body;

    // First verify the session belongs to this trainer
    const [checkRows] = await db.execute(
      "SELECT ptScheduleId FROM pt_schedule WHERE ptScheduleId = ? AND ptId = ?",
      [sessionId, ptId]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Session not found or not authorized",
      });
    }

    // Update status (assuming you add a status column to pt_schedule table)
    await db.execute(
      "UPDATE pt_schedule SET status = ? WHERE ptScheduleId = ?",
      [status, sessionId]
    );

    res.status(200).json({
      success: true,
      message: "Session status updated successfully",
    });
  } catch (error) {
    console.error("Update session status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating session status",
    });
  }
};

// Get earnings data
exports.getEarnings = async (req, res) => {
  try {
    const ptId = req.user.ptId;
    const { period = "month" } = req.query;

    let dateCondition = "";
    if (period === "month") {
      dateCondition =
        "AND MONTH(m.start) = MONTH(CURDATE()) AND YEAR(m.start) = YEAR(CURDATE())";
    } else if (period === "year") {
      dateCondition = "AND YEAR(m.start) = YEAR(CURDATE())";
    }

    const [rows] = await db.execute(
      `SELECT 
        COUNT(m.membershipId) as totalMemberships,
        COALESCE(SUM(ptr.amount), 0) as totalEarnings,
        AVG(ptr.amount) as avgEarningsPerClient
       FROM membership m
       JOIN pt_rate ptr ON m.ptRateId = ptr.ptRateId
       WHERE m.ptId = ? ${dateCondition}`,
      [ptId]
    );

    res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Get earnings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching earnings",
    });
  }
};

// Get trainer availability
exports.getAvailability = async (req, res) => {
  try {
    const ptId = req.user.ptId;

    const [rows] = await db.execute(
      "SELECT isAvailable FROM trainer WHERE ptId = ?",
      [ptId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { isAvailable: rows[0].isAvailable },
    });
  } catch (error) {
    console.error("Get availability error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching availability",
    });
  }
};

// Update trainer availability
exports.updateAvailability = async (req, res) => {
  try {
    const ptId = req.user.ptId;
    const { isAvailable } = req.body;

    await db.execute("UPDATE trainer SET isAvailable = ? WHERE ptId = ?", [
      isAvailable,
      ptId,
    ]);

    res.status(200).json({
      success: true,
      message: "Availability updated successfully",
    });
  } catch (error) {
    console.error("Update availability error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating availability",
    });
  }
};

// Get session statistics
exports.getSessionStats = async (req, res) => {
  try {
    const ptId = req.user.ptId;
    const { period = "month" } = req.query;

    let dateCondition = "";
    if (period === "month") {
      dateCondition =
        "AND MONTH(pts.scheduleDate) = MONTH(CURDATE()) AND YEAR(pts.scheduleDate) = YEAR(CURDATE())";
    } else if (period === "year") {
      dateCondition = "AND YEAR(pts.scheduleDate) = YEAR(CURDATE())";
    }

    const [rows] = await db.execute(
      `SELECT 
        COUNT(*) as totalSessions,
        COUNT(CASE WHEN pts.scheduleDate < CURDATE() THEN 1 END) as completedSessions,
        COUNT(CASE WHEN pts.scheduleDate >= CURDATE() THEN 1 END) as upcomingSessions
       FROM pt_schedule pts
       WHERE pts.ptId = ? ${dateCondition}`,
      [ptId]
    );

    res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Get session stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching session statistics",
    });
  }
};
