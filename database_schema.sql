-- database_schema.sql
-- TODO Web Application Database Schema (Cleaned Version - No Sample Data)

-- Create Database
CREATE DATABASE IF NOT EXISTS todo_app;
USE todo_app;

-- Create Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category ENUM('personal', 'work') NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_completed (completed),
    INDEX idx_created_at (created_at)
);

-- Create User Table (for future enhancement)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create User-Task Relationship (for future enhancement)
-- ALTER TABLE tasks ADD COLUMN user_id INT;
-- ALTER TABLE tasks ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Views for Statistics
CREATE OR REPLACE VIEW task_statistics AS
SELECT 
    COUNT(*) as total_tasks,
    SUM(CASE WHEN category = 'personal' THEN 1 ELSE 0 END) as personal_tasks,
    SUM(CASE WHEN category = 'work' THEN 1 ELSE 0 END) as work_tasks,
    SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) as completed_tasks,
    SUM(CASE WHEN completed = FALSE THEN 1 ELSE 0 END) as pending_tasks
FROM tasks;

-- Query Examples:

-- Get all tasks
-- SELECT * FROM tasks ORDER BY created_at DESC;

-- Get tasks by category
-- SELECT * FROM tasks WHERE category = 'work' ORDER BY created_at DESC;

-- Get completed tasks
-- SELECT * FROM tasks WHERE completed = TRUE ORDER BY updated_at DESC;

-- Get task statistics
-- SELECT * FROM task_statistics;

-- Monthly task creation report
-- SELECT 
--     DATE_FORMAT(created_at, '%Y-%m') as month,
--     category,
--     COUNT(*) as task_count
-- FROM tasks 
-- GROUP BY DATE_FORMAT(created_at, '%Y-%m'), category
-- ORDER BY month DESC;
