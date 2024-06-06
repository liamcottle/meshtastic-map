-- CreateTable
CREATE TABLE `power_metrics` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `node_id` BIGINT NOT NULL,
    `packet_id` BIGINT NULL,
    `ch1_voltage` DECIMAL(65, 30) NULL,
    `ch1_current` DECIMAL(65, 30) NULL,
    `ch2_voltage` DECIMAL(65, 30) NULL,
    `ch2_current` DECIMAL(65, 30) NULL,
    `ch3_voltage` DECIMAL(65, 30) NULL,
    `ch3_current` DECIMAL(65, 30) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `power_metrics_created_at_idx`(`created_at`),
    INDEX `power_metrics_updated_at_idx`(`updated_at`),
    INDEX `power_metrics_node_id_idx`(`node_id`),
    INDEX `power_metrics_packet_id_idx`(`packet_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
