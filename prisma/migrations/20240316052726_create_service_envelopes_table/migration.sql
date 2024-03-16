-- CreateTable
CREATE TABLE `service_envelopes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `mqtt_topic` VARCHAR(191) NOT NULL,
    `channel_id` VARCHAR(191) NOT NULL,
    `gateway_id` BIGINT NULL,
    `to` BIGINT NOT NULL,
    `from` BIGINT NOT NULL,
    `protobuf` LONGBLOB NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `service_envelopes_created_at_idx`(`created_at`),
    INDEX `service_envelopes_updated_at_idx`(`updated_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `waypoints_to_idx` ON `waypoints`(`to`);
