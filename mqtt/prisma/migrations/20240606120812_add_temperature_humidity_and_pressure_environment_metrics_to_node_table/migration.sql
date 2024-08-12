-- AlterTable
ALTER TABLE `nodes` ADD COLUMN `barometric_pressure` DECIMAL(65, 30) NULL,
    ADD COLUMN `relative_humidity` DECIMAL(65, 30) NULL,
    ADD COLUMN `temperature` DECIMAL(65, 30) NULL;
