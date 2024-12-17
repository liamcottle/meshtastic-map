-- AlterTable
ALTER TABLE `environment_metrics` ADD COLUMN `wind_direction` INTEGER NULL,
    ADD COLUMN `wind_gust` DECIMAL(65, 30) NULL,
    ADD COLUMN `wind_lull` DECIMAL(65, 30) NULL,
    ADD COLUMN `wind_speed` DECIMAL(65, 30) NULL;
