-- AlterTable
ALTER TABLE `nodes` ADD COLUMN `air_util_tx` DECIMAL(65, 30) NULL,
    ADD COLUMN `battery_level` INTEGER NULL,
    ADD COLUMN `channel_utilization` DECIMAL(65, 30) NULL,
    ADD COLUMN `voltage` DECIMAL(65, 30) NULL;
