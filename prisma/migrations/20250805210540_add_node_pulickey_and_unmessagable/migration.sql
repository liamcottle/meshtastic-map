-- AlterTable
ALTER TABLE `nodes` ADD COLUMN `is_unmessagable` BOOLEAN NULL,
    ADD COLUMN `public_key` VARCHAR(191) NULL;
