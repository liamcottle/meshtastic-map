-- CreateTable
CREATE TABLE `name_history` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `node_id` BIGINT NOT NULL,
    `long_name` VARCHAR(191) NOT NULL,
    `short_name` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `name_history_node_id_idx`(`node_id`),
    INDEX `name_history_long_name_idx`(`long_name`),
    INDEX `name_history_created_at_idx`(`created_at`),
    INDEX `name_history_updated_at_idx`(`updated_at`),
    UNIQUE INDEX `name_history_node_id_long_name_short_name_key`(`node_id`, `long_name`, `short_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
