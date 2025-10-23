/*
  Warnings:

  - You are about to drop the `galleryEntry` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `galleryEntry` DROP FOREIGN KEY `galleryEntry_guildId_fkey`;

-- DropTable
DROP TABLE `galleryEntry`;

-- CreateTable
CREATE TABLE `gallery_entry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `guildId` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `originalCode` VARCHAR(191) NOT NULL,
    `hash` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `gallery_entry_guildId_hash_key`(`guildId`, `hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `gallery_entry` ADD CONSTRAINT `gallery_entry_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `gallery`(`channelId`) ON DELETE CASCADE ON UPDATE CASCADE;
