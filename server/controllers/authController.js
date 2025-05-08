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

    const token = jwt.sign(
      {
        id: user.id,
        membershipId: user.membershipId,
        customerId: user.customerId,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        membershipId: user.membershipId,
        customerId: user.customerId,
        username: user.username,
      },
      token,
    });
  } catch (error) {
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
