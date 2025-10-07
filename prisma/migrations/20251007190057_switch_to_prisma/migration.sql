-- CreateTable
CREATE TABLE `auto_embed_channel` (
    `channel_id` VARCHAR(255) NOT NULL,
    `guild_id` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`channel_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
