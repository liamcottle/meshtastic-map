-- AlterTable
ALTER TABLE `traceroutes` ADD COLUMN `route_back` JSON NULL,
    ADD COLUMN `snr_back` JSON NULL,
    ADD COLUMN `snr_towards` JSON NULL;
