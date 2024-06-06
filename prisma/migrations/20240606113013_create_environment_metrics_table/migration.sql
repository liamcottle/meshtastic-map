-- CreateTable
CREATE TABLE `environment_metrics` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `node_id` BIGINT NOT NULL,
    `packet_id` BIGINT NULL,
    `temperature` DECIMAL(65, 30) NULL,
    `relative_humidity` DECIMAL(65, 30) NULL,
    `barometric_pressure` DECIMAL(65, 30) NULL,
    `gas_resistance` DECIMAL(65, 30) NULL,
    `voltage` DECIMAL(65, 30) NULL,
    `current` DECIMAL(65, 30) NULL,
    `iaq` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `environment_metrics_created_at_idx`(`created_at`),
    INDEX `environment_metrics_updated_at_idx`(`updated_at`),
    INDEX `environment_metrics_node_id_idx`(`node_id`),
    INDEX `environment_metrics_packet_id_idx`(`packet_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
