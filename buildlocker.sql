-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 04, 2026 at 12:20 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `buildlocker`
--

-- --------------------------------------------------------

--
-- Table structure for table `buildings`
--

CREATE TABLE `buildings` (
  `building_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `city` varchar(100) NOT NULL,
  `address` varchar(255) NOT NULL,
  `manager_id` varchar(9) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` varchar(9) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `buildings`
--

INSERT INTO `buildings` (`building_id`, `name`, `city`, `address`, `manager_id`, `is_active`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Building A Updated', 'Rehovot', 'Herzl 12', '343434343', 1, '111111111', '2026-05-03 21:29:58', '2026-05-03 21:50:39'),
(2, 'Building A', 'Rehovot', 'Herzl 10', '343434343', 1, '111111111', '2026-05-03 21:36:55', '2026-05-03 21:50:04');

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `item_id` int(10) UNSIGNED NOT NULL,
  `locker_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lockers`
--

CREATE TABLE `lockers` (
  `locker_id` int(10) UNSIGNED NOT NULL,
  `building_id` int(10) UNSIGNED NOT NULL,
  `locker_number` int(11) NOT NULL,
  `status` enum('available','in_use') NOT NULL DEFAULT 'available',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `last_opened_at` datetime DEFAULT NULL,
  `last_opened_by` varchar(9) DEFAULT NULL,
  `created_by` varchar(9) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lockers`
--

INSERT INTO `lockers` (`locker_id`, `building_id`, `locker_number`, `status`, `is_active`, `notes`, `last_opened_at`, `last_opened_by`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'available', 1, 'Updated locker notes', '2026-05-04 00:54:42', '111111111', '111111111', '2026-05-03 21:51:18', '2026-05-03 21:55:50');

-- --------------------------------------------------------

--
-- Table structure for table `locker_devices`
--

CREATE TABLE `locker_devices` (
  `device_id` int(10) UNSIGNED NOT NULL,
  `locker_id` int(10) UNSIGNED NOT NULL,
  `device_uid` varchar(100) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `connection_status` enum('online','offline') DEFAULT 'offline',
  `last_seen_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `locker_events`
--

CREATE TABLE `locker_events` (
  `event_id` int(10) UNSIGNED NOT NULL,
  `locker_id` int(10) UNSIGNED NOT NULL,
  `user_id` varchar(9) DEFAULT NULL,
  `event_type` enum('created','updated','activated','deactivated','opened','returned') NOT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `locker_events`
--

INSERT INTO `locker_events` (`event_id`, `locker_id`, `user_id`, `event_type`, `details`, `created_at`) VALUES
(1, 1, '111111111', 'created', '{\"building_id\":1,\"locker_number\":1}', '2026-05-03 21:51:18'),
(2, 1, '111111111', 'updated', '{\"locker_number\":2,\"notes\":\"Updated locker notes\"}', '2026-05-03 21:52:50'),
(3, 1, '111111111', 'updated', '{\"locker_number\":1,\"notes\":\"Updated locker notes\"}', '2026-05-03 21:53:08'),
(4, 1, '111111111', 'deactivated', '{\"is_active\":0}', '2026-05-03 21:53:19'),
(5, 1, '111111111', 'activated', '{\"is_active\":1}', '2026-05-03 21:53:29'),
(6, 1, '111111111', 'opened', '{\"previous_status\":\"available\",\"new_status\":\"in_use\"}', '2026-05-03 21:53:59'),
(7, 1, '111111111', 'returned', '{\"previous_status\":\"in_use\",\"new_status\":\"available\"}', '2026-05-03 21:54:34'),
(8, 1, '111111111', 'opened', '{\"previous_status\":\"available\",\"new_status\":\"in_use\"}', '2026-05-03 21:54:42'),
(9, 1, '111111111', 'returned', '{\"previous_status\":\"in_use\",\"new_status\":\"available\"}', '2026-05-03 21:55:50');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` varchar(9) NOT NULL,
  `full_name` varchar(120) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('super','manager','user') NOT NULL DEFAULT 'user',
  `building_id` int(10) UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` varchar(9) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `email`, `phone`, `password_hash`, `role`, `building_id`, `is_active`, `created_by`, `created_at`, `updated_at`, `last_login_at`) VALUES
('111111111', 'Nerya Levi', 'super@test.com', '0522859094', '$2b$10$gyfUWFmUywplP4otb3xCmehW.5hjxLKefSzr/5lkC6zH2nueL14JC', 'super', NULL, 1, NULL, '2026-05-01 05:32:15', '2026-05-03 21:29:00', '2026-05-04 00:23:53'),
('222222222', 'Building Manager', 'manager@test.com', '0501111111', '$2b$10$AMzjYc4d4FWqMBjtBstebO.iEk8P//2TK/.ZJjlPt8o5LHLg8Q9mW', 'manager', 2, 1, '111111111', '2026-05-03 21:29:26', '2026-05-03 21:38:09', NULL),
('333333333', 'Regular User', 'user@test.com', '0502222222', '$2b$10$317Jt1EJF1IYJKERHZ0xbuWwSOCoEGUnVD/B4FD7DFjACZIylHcKK', 'user', 2, 1, '111111111', '2026-05-03 21:30:08', '2026-05-03 21:37:24', NULL),
('343434343', 'Building Manager', 'managerr@test.com', '0501111112', '$2b$10$pBETd5.7cNYHIF4r8Cb6De9PPZc1dngZ7setGa4d/vJdFJCvVW3pC', 'manager', NULL, 1, '111111111', '2026-05-03 21:45:35', '2026-05-03 21:45:35', NULL),
('444444444', 'Manager Created User', 'user2@test.com', '0503333333', '$2b$10$.mG7yjmfk2Z4szNygDWoouz1us7tbYkas9pyBipbTaZkUqr2nEKOW', 'user', 1, 1, '111111111', '2026-05-03 21:30:23', '2026-05-03 21:43:08', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `buildings`
--
ALTER TABLE `buildings`
  ADD PRIMARY KEY (`building_id`),
  ADD KEY `idx_buildings_is_active` (`is_active`),
  ADD KEY `idx_buildings_manager` (`manager_id`),
  ADD KEY `idx_buildings_created_by` (`created_by`);

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `idx_items_locker` (`locker_id`),
  ADD KEY `idx_items_active` (`is_active`);

--
-- Indexes for table `lockers`
--
ALTER TABLE `lockers`
  ADD PRIMARY KEY (`locker_id`),
  ADD UNIQUE KEY `uq_lockers_building_number` (`building_id`,`locker_number`),
  ADD KEY `idx_lockers_building` (`building_id`),
  ADD KEY `idx_lockers_status` (`status`),
  ADD KEY `idx_lockers_is_active` (`is_active`),
  ADD KEY `idx_lockers_last_opened_by` (`last_opened_by`),
  ADD KEY `idx_lockers_created_by` (`created_by`);

--
-- Indexes for table `locker_devices`
--
ALTER TABLE `locker_devices`
  ADD PRIMARY KEY (`device_id`),
  ADD UNIQUE KEY `uq_locker_devices_uid` (`device_uid`),
  ADD KEY `idx_devices_locker` (`locker_id`),
  ADD KEY `idx_devices_status` (`connection_status`);

--
-- Indexes for table `locker_events`
--
ALTER TABLE `locker_events`
  ADD PRIMARY KEY (`event_id`),
  ADD KEY `idx_locker_events_locker` (`locker_id`),
  ADD KEY `idx_locker_events_user` (`user_id`),
  ADD KEY `idx_locker_events_type` (`event_type`),
  ADD KEY `idx_locker_events_created_at` (`created_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `uq_users_email` (`email`),
  ADD UNIQUE KEY `uq_users_phone` (`phone`),
  ADD KEY `idx_users_role` (`role`),
  ADD KEY `idx_users_active` (`is_active`),
  ADD KEY `idx_users_building_id` (`building_id`),
  ADD KEY `idx_users_created_by` (`created_by`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `buildings`
--
ALTER TABLE `buildings`
  MODIFY `building_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `item_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lockers`
--
ALTER TABLE `lockers`
  MODIFY `locker_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `locker_devices`
--
ALTER TABLE `locker_devices`
  MODIFY `device_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `locker_events`
--
ALTER TABLE `locker_events`
  MODIFY `event_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `buildings`
--
ALTER TABLE `buildings`
  ADD CONSTRAINT `fk_buildings_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_buildings_manager` FOREIGN KEY (`manager_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `items`
--
ALTER TABLE `items`
  ADD CONSTRAINT `fk_items_locker` FOREIGN KEY (`locker_id`) REFERENCES `lockers` (`locker_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `lockers`
--
ALTER TABLE `lockers`
  ADD CONSTRAINT `fk_lockers_building` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`building_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_lockers_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_lockers_last_opened_by` FOREIGN KEY (`last_opened_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `locker_devices`
--
ALTER TABLE `locker_devices`
  ADD CONSTRAINT `fk_devices_locker` FOREIGN KEY (`locker_id`) REFERENCES `lockers` (`locker_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `locker_events`
--
ALTER TABLE `locker_events`
  ADD CONSTRAINT `fk_locker_events_locker` FOREIGN KEY (`locker_id`) REFERENCES `lockers` (`locker_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_locker_events_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_building` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`building_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_users_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
