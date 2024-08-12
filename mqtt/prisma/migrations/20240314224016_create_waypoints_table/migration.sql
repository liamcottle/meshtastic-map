-- CreateTable
CREATE TABLE `waypoints` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `from` BIGINT NOT NULL,
    `to` BIGINT NOT NULL,
    `waypoint_id` BIGINT NOT NULL,
    `latitude` INTEGER NOT NULL,
    `longitude` INTEGER NOT NULL,
    `expire` BIGINT NULL,
    `locked_to` BIGINT NULL,
    `name` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `icon` INTEGER NULL,
    `channel` INTEGER NOT NULL,
    `packet_id` BIGINT NOT NULL,
    `channel_id` VARCHAR(191) NOT NULL,
    `gateway_id` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `waypoints_created_at_idx`(`created_at`),
    INDEX `waypoints_updated_at_idx`(`updated_at`),
    INDEX `waypoints_from_idx`(`from`),
    INDEX `waypoints_waypoint_id_idx`(`waypoint_id`),
    INDEX `waypoints_packet_id_idx`(`packet_id`),
    INDEX `waypoints_gateway_id_idx`(`gateway_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
