/*
  Warnings:

  - You are about to drop the column `node_id` on the `traceroutes` table. All the data in the column will be lost.
  - Added the required column `from` to the `traceroutes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `to` to the `traceroutes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `want_response` to the `traceroutes` table without a default value. This is not possible if the table is not empty.

*/

-- NOTE: manually added query, to drop existing traceroutes before adding required columns
TRUNCATE table `traceroutes`;

-- DropIndex
DROP INDEX `traceroutes_node_id_idx` ON `traceroutes`;

-- AlterTable
ALTER TABLE `traceroutes` DROP COLUMN `node_id`,
    ADD COLUMN `from` BIGINT NOT NULL,
    ADD COLUMN `to` BIGINT NOT NULL,
    ADD COLUMN `want_response` BOOLEAN NOT NULL;

-- CreateIndex
CREATE INDEX `traceroutes_to_idx` ON `traceroutes`(`to`);

-- CreateIndex
CREATE INDEX `traceroutes_from_idx` ON `traceroutes`(`from`);
