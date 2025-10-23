/*
  Warnings:

  - A unique constraint covering the columns `[postId]` on the table `gallery_entry` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `gallery_entry_postId_key` ON `gallery_entry`(`postId`);
