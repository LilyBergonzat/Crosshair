/*
  Warnings:

  - A unique constraint covering the columns `[webhookId]` on the table `gallery` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `webhookId` to the `gallery` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `gallery` ADD COLUMN `webhookId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `gallery_webhookId_key` ON `gallery`(`webhookId`);
