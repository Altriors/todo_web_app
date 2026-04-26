// config/database.js - Database Configuration
const mysql = require('mysql2/promise');
require('dotenv').config();

// Database Configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'todo_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Database initialization
async function initializeDatabase() {
  try {
    // First, create connection without database specified
    const tempConfig = { ...dbConfig };
    delete tempConfig.database;
    const tempPool = mysql.createPool(tempConfig);
    
    const connection = await tempPool.getConnection();
    
    // Create database if it doesn't exist using query() instead of execute()
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    connection.release();
    await tempPool.end();
    
    // Now use the main pool with database specified
    const mainConnection = await pool.getConnection();
    
    // Create tasks table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category ENUM('personal', 'work') NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    await mainConnection.execute(createTableQuery);
    console.log('Database and tables initialized successfully');
    mainConnection.release();
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

module.exports = {
  pool,
  initializeDatabase,
  dbConfig
};