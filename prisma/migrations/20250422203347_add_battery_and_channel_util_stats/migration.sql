-- CreateTable
CREATE TABLE `battery_stats` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `recorded_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `avg_battery_level` DECIMAL(5, 2) NULL,

    INDEX `battery_stats_recorded_at_idx`(`recorded_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `channel_utilization_stats` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `recorded_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `avg_channel_utilization` DECIMAL(65, 30) NULL,

    INDEX `channel_utilization_stats_recorded_at_idx`(`recorded_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
