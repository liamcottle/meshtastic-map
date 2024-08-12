-- CreateTable
CREATE TABLE `device_metrics` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `node_id` BIGINT NOT NULL,
    `battery_level` INTEGER NULL,
    `voltage` DECIMAL(65, 30) NULL,
    `channel_utilization` DECIMAL(65, 30) NULL,
    `air_util_tx` DECIMAL(65, 30) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `device_metrics_created_at_idx`(`created_at`),
    INDEX `device_metrics_updated_at_idx`(`updated_at`),
    INDEX `device_metrics_node_id_idx`(`node_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
