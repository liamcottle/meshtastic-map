-- AlterTable
ALTER TABLE `nodes` ADD COLUMN `neighbour_broadcast_interval_secs` INTEGER NULL,
    ADD COLUMN `neighbours` JSON NULL;
