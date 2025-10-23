-- CreateTable
CREATE TABLE `gallery` (
    `channelId` VARCHAR(191) NOT NULL,
    `guildId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `gallery_guildId_key`(`guildId`),
    PRIMARY KEY (`channelId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `galleryEntry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `guildId` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `originalCode` VARCHAR(191) NOT NULL,
    `hash` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `galleryEntry` ADD CONSTRAINT `galleryEntry_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `gallery`(`channelId`) ON DELETE CASCADE ON UPDATE CASCADE;
