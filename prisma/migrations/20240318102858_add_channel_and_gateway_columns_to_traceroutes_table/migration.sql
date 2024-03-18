-- AlterTable
ALTER TABLE `traceroutes` ADD COLUMN `channel` INTEGER NULL,
    ADD COLUMN `channel_id` VARCHAR(191) NULL,
    ADD COLUMN `gateway_id` BIGINT NULL,
    ADD COLUMN `packet_id` BIGINT NULL;
