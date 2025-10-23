/*
  Warnings:

  - A unique constraint covering the columns `[guildId,hash]` on the table `galleryEntry` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `galleryEntry_guildId_hash_key` ON `galleryEntry`(`guildId`, `hash`);
