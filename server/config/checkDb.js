const db = require("./database");

async function checkTables() {
  try {
    // Check if member_account table exists
    const [tablesResult] = await db.execute(
      "SHOW TABLES LIKE 'member_account'"
    );

    if (tablesResult.length === 0) {
      console.error("ERROR: member_account table does not exist!");
      console.log(
        "Please create the member_account table with the following structure:"
      );
      console.log(`
CREATE TABLE member_account (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  email VARCHAR(100)
);
      `);
      console.log("Sample data:");
      console.log(`
INSERT INTO member_account (username, password, name, email) 
VALUES ('admin', 'password123', 'Admin User', 'admin@example.com');
      `);
      return false;
    }

    // Check table structure
    const [columnsResult] = await db.execute(
      "SHOW COLUMNS FROM member_account"
    );

    const columnNames = columnsResult.map((col) => col.Field);
    const requiredColumns = ["id", "username", "password"];

    const missingColumns = requiredColumns.filter(
      (col) => !columnNames.includes(col)
    );

    if (missingColumns.length > 0) {
      console.error(
        `ERROR: member_account table is missing required columns: ${missingColumns.join(
          ", "
        )}`
      );
      return false;
    }

    // Check if there are any users
    const [usersResult] = await db.execute(
      "SELECT COUNT(*) as count FROM member_account"
    );

    if (usersResult[0].count === 0) {
      console.warn("WARNING: No users found in member_account table");
      console.log("Sample data to insert:");
      console.log(`
INSERT INTO member_account (username, password, name, email) 
VALUES ('admin', 'password123', 'Admin User', 'admin@example.com');
      `);
    } else {
      console.log(
        `Found ${usersResult[0].count} users in member_account table`
      );
    }

    return true;
  } catch (error) {
    console.error("Error checking database tables:", error.message);
    return false;
  }
}

module.exports = { checkTables };
