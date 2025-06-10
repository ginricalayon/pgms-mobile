const db = require("../config/database");

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.execute(
      "SELECT m.membershipId, ma.username, c.firstName, c.lastName, c.gender, c.birthdate, c.address, c.phoneNumber, m.picture, m.isRegular FROM customer c JOIN membership m ON c.customerId = m.customerId JOIN member_account ma ON ma.membershipId = m.membershipId WHERE ma.id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (rows[0].picture) {
      rows[0].picture = rows[0].picture.toString("base64");
    }

    res.status(200).json({
      success: true,
      user: rows[0],
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};

exports.getMembershipDetails = async (req, res) => {
  try {
    const membershipId = req.user.membershipId;

    const [rows] = await db.execute(
      "SELECT m.membershipId, c.firstName as customerFirstName, c.lastName as customerLastName, r.name as rateName, v.validity as rateValidity, p.firstName as trainerFirstName, p.lastName as trainerLastName, p.ptId as trainerId, m.start, m.end, m.isRegular, m.isFreeze, m.freezeStartDate, m.freezeEndDate, m.cancelled_date, m.status, m.picture FROM membership m JOIN customer c ON m.customerId = c.customerId JOIN gym_rates r ON r.rateId = m.rateId JOIN rate_validity v ON v.validityId = r.validityId LEFT JOIN pt_info p ON m.ptId = p.ptId WHERE m.membershipId = ?",
      [membershipId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (rows[0].picture) {
      rows[0].picture = rows[0].picture.toString("base64");
    }

    res.status(200).json({
      success: true,
      user: rows[0],
    });
  } catch (error) {
    console.log("Get membership details error", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};

exports.getCheckIns = async (req, res) => {
  try {
    const memberId = req.user.membershipId;

    const [rows] = await db.execute(
      "SELECT date, timeIn FROM member_attendance WHERE memberId = ? ORDER BY date DESC, timeIn DESC",
      [memberId]
    );

    res.status(200).json({
      success: true,
      checkIns: rows,
    });
  } catch (error) {
    console.log("Get check ins error", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching check ins",
    });
  }
};

exports.getSchedules = async (req, res) => {
  try {
    const memberId = req.user.membershipId;

    const [rows] = await db.execute(
      "SELECT s.memberScheduleId as ID, ps.scheduleDate AS Day, ps.startTime AS StartTime, ps.endTime AS EndTime FROM member_schedule s JOIN pt_schedule ps ON s.ptScheduleId = ps.ptScheduleId WHERE s.memberId = ?",
      [memberId]
    );

    res.status(200).json({
      success: true,
      schedules: rows,
    });
  } catch (error) {
    console.log("Get schedules error", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching schedules",
    });
  }
};

exports.getTrainerInfo = async (req, res) => {
  try {
    const membershipId = req.user.membershipId;

    const [rows] = await db.execute(
      "SELECT p.firstName, p.lastName, p.phoneNumber FROM pt_info p JOIN membership m ON p.ptId = m.ptId WHERE m.membershipId = ?",
      [membershipId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "You don't have a personal trainer",
      });
    }

    res.status(200).json({
      success: true,
      trainerInfo: rows[0],
    });
  } catch (error) {
    console.log("Get trainer info error", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching trainer info",
    });
  }
};

exports.editProfile = async (req, res) => {
  try {
    const { firstName, lastName, gender, birthdate, address, phoneNumber } =
      req.body;
    const customerId = req.user.customerId;

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
      "SELECT customerId FROM customer WHERE phoneNumber = ? AND customerId != ?";
    const [existingPhone] = await db.query(checkPhoneQuery, [
      phoneNumber,
      customerId,
    ]);

    if (existingPhone.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists",
      });
    }

    const updateQuery = `
      UPDATE customer 
      SET firstName = ?,
          lastName = ?,
          gender = ?,
          birthdate = ?,
          address = ?,
          phoneNumber = ?
      WHERE customerId = ?
    `;

    const [result] = await db.query(updateQuery, [
      firstName,
      lastName,
      gender,
      formattedBirthdate,
      address,
      phoneNumber,
      customerId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const [updatedMember] = await db.query(
      "SELECT customerId, firstName, lastName, gender, birthdate, address, phoneNumber FROM customer WHERE customerId = ?",
      [customerId]
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedMember[0],
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const customerId = req.user.customerId;

    const [rows] = await db.execute(
      `SELECT 
        t.transactionId,
        t.rateName,
        t.rateAmount,
        t.paymentType,
        t.totalCost,
        t.date
      FROM transaction t
      JOIN customer c ON t.customerId = c.customerId
      WHERE c.customerId = ?
      ORDER BY t.date DESC`,
      [customerId]
    );

    res.status(200).json({
      success: true,
      transactions: rows,
    });
  } catch (error) {
    console.log("Get transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching transactions",
    });
  }
};

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

exports.getMembershipStatus = async (req, res) => {
  try {
    const membershipId = req.user.membershipId;

    const [rows] = await db.execute(
      `SELECT 
        status 
      FROM membership
      WHERE membershipId = ?
      `,
      [membershipId]
    );

    res.status(200).json({
      success: true,
      status: rows,
    });
  } catch (error) {
    console.log("Get membership status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching membership status",
    });
  }
};

exports.getMembershipRates = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT r.rateId, r.name, r.cost, r.validityId, v.validity FROM gym_rates r JOIN rate_validity v ON r.validityId = v.validityId WHERE v.validity != '1 Day'"
    );
    res.status(200).json({
      success: true,
      rates: rows,
    });
  } catch (error) {
    console.log("Get membership rates error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching membership rates",
    });
  }
};

exports.getPersonalTrainerRates = async (req, res) => {
  try {
    const validityId = req.params.validityId || req.query.validityId;

    if (!validityId) {
      return res.status(400).json({
        success: false,
        message: "ValidityId is required",
      });
    }

    const [rows] = await db.execute(
      "SELECT p.ptRateId, p.validityId, p.amount, v.validity FROM pt_rate p JOIN rate_validity v ON p.validityId = v.validityId WHERE v.validityId = ?",
      [validityId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
      });
    }

    res.status(200).json({
      success: true,
      rate: rows[0],
    });
  } catch (error) {
    console.log("Get personal trainer rates error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching personal trainer rates",
    });
  }
};

exports.getAvailableTrainers = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT info.ptId, info.firstName, info.lastName, info.gender, info.address, info.phoneNumber, trainer.isAvailable FROM pt_info info JOIN personal_trainer trainer ON info.ptId = trainer.ptId WHERE trainer.isAvailable = 1"
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No available trainers found",
      });
    }

    res.status(200).json({
      success: true,
      trainers: rows,
    });
  } catch (error) {
    console.log("Get available trainers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching available trainers",
    });
  }
};

exports.getTrainerAvailableSchedules = async (req, res) => {
  try {
    const trainerId = req.query.trainerId;

    if (!trainerId) {
      return res.status(400).json({
        success: false,
        message: "TrainerId is required",
      });
    }

    const [rows] = await db.execute(
      "SELECT s.ptScheduleId, s.ptId, s.scheduleDate, s.startTime, s.endTime, s.isAvailable FROM pt_schedule s WHERE s.ptId = ? AND s.isAvailable = 1",
      [trainerId]
    );

    res.status(200).json({
      success: true,
      schedules: rows,
    });
  } catch (error) {
    console.log("Get trainer available schedules error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching trainer available schedules",
    });
  }
};
