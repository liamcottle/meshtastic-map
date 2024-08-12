-- CreateTable
CREATE TABLE `nodes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `node_id` BIGINT NOT NULL,
    `long_name` VARCHAR(191) NOT NULL,
    `short_name` VARCHAR(191) NOT NULL,
    `hardware_model` INTEGER NOT NULL,
    `is_licensed` BOOLEAN NOT NULL,
    `role` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `nodes_node_id_key`(`node_id`),
    INDEX `nodes_created_at_idx`(`created_at`),
    INDEX `nodes_updated_at_idx`(`updated_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
