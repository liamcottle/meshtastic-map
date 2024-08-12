-- CreateTable
CREATE TABLE `text_messages` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `to` BIGINT NOT NULL,
    `from` BIGINT NOT NULL,
    `channel` INTEGER NOT NULL,
    `packet_id` BIGINT NOT NULL,
    `channel_id` VARCHAR(191) NOT NULL,
    `gateway_id` BIGINT NULL,
    `text` VARCHAR(191) NOT NULL,
    `rx_time` BIGINT NULL,
    `rx_snr` DECIMAL(65, 30) NULL,
    `rx_rssi` INTEGER NULL,
    `hop_limit` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `text_messages_created_at_idx`(`created_at`),
    INDEX `text_messages_updated_at_idx`(`updated_at`),
    INDEX `text_messages_to_idx`(`to`),
    INDEX `text_messages_from_idx`(`from`),
    INDEX `text_messages_packet_id_idx`(`packet_id`),
    INDEX `text_messages_gateway_id_idx`(`gateway_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
