-- AlterTable
ALTER TABLE `nodes` ADD COLUMN `firmware_version` VARCHAR(191) NULL,
    ADD COLUMN `has_default_channel` BOOLEAN NULL,
    ADD COLUMN `modem_preset` INTEGER NULL,
    ADD COLUMN `num_online_local_nodes` INTEGER NULL,
    ADD COLUMN `position_precision` INTEGER NULL,
    ADD COLUMN `region` INTEGER NULL;
