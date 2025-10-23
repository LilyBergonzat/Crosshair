/*
  Warnings:

  - You are about to drop the column `guildId` on the `gallery_entry` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[channelId,hash]` on the table `gallery_entry` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `channelId` to the `gallery_entry` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `gallery_entry` DROP FOREIGN KEY `gallery_entry_guildId_fkey`;

-- DropIndex
DROP INDEX `gallery_entry_guildId_hash_key` ON `gallery_entry`;

-- AlterTable
ALTER TABLE `gallery_entry` DROP COLUMN `guildId`,
    ADD COLUMN `channelId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `gallery_entry_channelId_hash_key` ON `gallery_entry`(`channelId`, `hash`);

-- AddForeignKey
ALTER TABLE `gallery_entry` ADD CONSTRAINT `gallery_entry_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `gallery`(`channelId`) ON DELETE CASCADE ON UPDATE CASCADE;
