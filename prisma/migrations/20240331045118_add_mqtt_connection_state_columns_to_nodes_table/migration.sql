-- AlterTable
ALTER TABLE `nodes` ADD COLUMN `mqtt_connection_state` VARCHAR(191) NULL,
    ADD COLUMN `mqtt_connection_state_updated_at` DATETIME(3) NULL;
