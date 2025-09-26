-- Database initialization script for production
-- This script will be executed when MySQL container starts for the first time

-- Ensure UTF8 character set
CREATE DATABASE IF NOT EXISTS exam_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create database user
CREATE USER IF NOT EXISTS 'exam_user'@'%' IDENTIFIED BY 'exam_password_production_2024';

-- Grant privileges
GRANT ALL PRIVILEGES ON exam_management.* TO 'exam_user'@'%';

-- Flush privileges
FLUSH PRIVILEGES;

-- Use the database
USE exam_management;

-- Create a simple status table to verify database connection
CREATE TABLE IF NOT EXISTS `db_status` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `status` VARCHAR(50) NOT NULL DEFAULT 'ready',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `message` TEXT
);

-- Insert initial status
INSERT INTO `db_status` (`status`, `message`) VALUES
('initialized', 'Database initialized successfully for exam management system');

-- Set MySQL configuration for better performance
SET GLOBAL innodb_buffer_pool_size = 128M;
SET GLOBAL max_connections = 100;
SET GLOBAL query_cache_size = 32M;
SET GLOBAL query_cache_type = 1;