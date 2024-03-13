-- CreateTable
CREATE TABLE `map_reports` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `node_id` BIGINT NOT NULL,
    `long_name` VARCHAR(191) NOT NULL,
    `short_name` VARCHAR(191) NOT NULL,
    `role` INTEGER NOT NULL,
    `hardware_model` INTEGER NOT NULL,
    `firmware_version` VARCHAR(191) NOT NULL,
    `region` INTEGER NULL,
    `modem_preset` INTEGER NULL,
    `has_default_channel` BOOLEAN NULL,
    `latitude` INTEGER NULL,
    `longitude` INTEGER NULL,
    `altitude` INTEGER NULL,
    `position_precision` INTEGER NULL,
    `num_online_local_nodes` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `map_reports_created_at_idx`(`created_at`),
    INDEX `map_reports_updated_at_idx`(`updated_at`),
    INDEX `map_reports_node_id_idx`(`node_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
