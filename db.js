require('dotenv').config(); // Load environment variables from .env file
const mysql = require('mysql2');

// MySQL Connection Configuration using environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
});

(async () => {
  try {
    const connection = await pool.promise().getConnection();

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log('Database created or already exists.');

    // Switch to the database
    await connection.query(`USE ${process.env.DB_NAME}`);

    // Create the "users" table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "users" created or already exists.');

    // Create the "friends" table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS friends (
        user_id INT NOT NULL,
        friend_id INT NOT NULL,
        PRIMARY KEY (user_id, friend_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (friend_id) REFERENCES users(id)
      )
    `);
    console.log('Table "friends" created or already exists.');

    // Create the "plans" table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        duration VARCHAR(50) NOT NULL,
        category ENUM('travel', 'shop', 'socialize', 'business') NOT NULL,
        location VARCHAR(255) NOT NULL,
        location_lat DECIMAL(10, 8) NOT NULL,
        location_lon DECIMAL(11, 8) NOT NULL,
        features TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        max_participants INT NOT NULL DEFAULT 0,
        current_participants INT NOT NULL DEFAULT 0,
        invited_friends TEXT,
        posted_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (posted_by) REFERENCES users(id)
      )
    `);
    console.log('Table "plans" created or already exists.');

    connection.release();
  } catch (err) {
    console.error('Error setting up the database:', err.message);
  }
})();

module.exports = pool.promise();
