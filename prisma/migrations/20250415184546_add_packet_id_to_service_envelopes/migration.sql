-- AlterTable
ALTER TABLE `service_envelopes` ADD COLUMN `packet_id` BIGINT NULL;

-- CreateIndex
CREATE INDEX `service_envelopes_packet_id_idx` ON `service_envelopes`(`packet_id`);
