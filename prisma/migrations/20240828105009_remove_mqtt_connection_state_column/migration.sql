/*
  Warnings:

  - You are about to drop the column `mqtt_connection_state` on the `nodes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `nodes` DROP COLUMN `mqtt_connection_state`;
