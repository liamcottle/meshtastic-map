-- CreateTable
CREATE TABLE `positions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `node_id` BIGINT NOT NULL,
    `to` BIGINT NOT NULL,
    `from` BIGINT NOT NULL,
    `channel` INTEGER NULL,
    `packet_id` BIGINT NULL,
    `channel_id` VARCHAR(191) NULL,
    `gateway_id` BIGINT NULL,
    `latitude` INTEGER NULL,
    `longitude` INTEGER NULL,
    `altitude` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `positions_created_at_idx`(`created_at`),
    INDEX `positions_updated_at_idx`(`updated_at`),
    INDEX `positions_node_id_idx`(`node_id`),
    INDEX `positions_packet_id_idx`(`packet_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
