const db = require("../config/database");
const jwt = require("jsonwebtoken");

// Login controller
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const [rows] = await db.execute(
      "SELECT * FROM member_account WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const user = rows[0];

    if (password !== user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const userRole = user.role;
    let firstName = null,
      lastName = null;

    try {
      if (userRole === "trainer") {
        const [trainerRows] = await db.execute(
          "SELECT firstName, lastName FROM pt_info WHERE ptId = ?",
          [user.customerId]
        );

        if (trainerRows.length > 0) {
          firstName = trainerRows[0].firstName;
          lastName = trainerRows[0].lastName;
        }
      } else {
        const [customerRows] = await db.execute(
          "SELECT firstName, lastName FROM customer WHERE customerId = ?",
          [user.customerId]
        );
        if (customerRows.length > 0) {
          firstName = customerRows[0].firstName;
          lastName = customerRows[0].lastName;
        }
      }
    } catch (error) {
      console.error("Something went wrong:", error);
    }

    const token = jwt.sign(
      {
        id: user.id,
        membershipId: user.membershipId,
        customerId: user.customerId,
        username: user.username,
        role: userRole,
        firstName: firstName,
        lastName: lastName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        membershipId: user.membershipId,
        customerId: user.customerId,
        username: user.username,
        role: userRole,
        firstName: firstName,
        lastName: lastName,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.execute(
      "SELECT ma.id, ma.username, c.firstName, c.lastName, c.gender, c.birthdate, c.address, c.phoneNumber, m.picture, m.isRegular FROM member_account ma JOIN membership m ON ma.membershipId = m.membershipId JOIN customer c ON c.customerId = ma.customerId WHERE ma.id = ?",
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
      user: {
        id: rows[0].id,
        username: rows[0].username,
        firstName: rows[0].firstName,
        lastName: rows[0].lastName,
        gender: rows[0].gender,
        birthdate: rows[0].birthdate,
        address: rows[0].address,
        phoneNumber: rows[0].phoneNumber,
        isRegular: rows[0].isRegular,
        picture: rows[0].picture,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user data",
    });
  }
};

// Verify token
exports.verifyToken = async (req, res) => {
  try {
    // If we reach here, the token is valid (middleware already verified it)
    const userId = req.user.id;

    const [rows] = await db.execute(
      "SELECT ma.id, ma.username, ma.membershipId, ma.customerId, c.firstName, c.lastName FROM member_account ma JOIN customer c ON c.customerId = ma.customerId WHERE ma.id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Token is valid",
      user: {
        id: rows[0].id,
        membershipId: rows[0].membershipId,
        customerId: rows[0].customerId,
        username: rows[0].username,
        firstName: rows[0].firstName,
        lastName: rows[0].lastName,
      },
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during token verification",
    });
  }
};
