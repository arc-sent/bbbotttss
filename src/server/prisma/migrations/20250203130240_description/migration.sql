/*
  Warnings:

  - You are about to drop the column `nickname` on the `UserBot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserBot" DROP COLUMN "nickname",
ADD COLUMN     "description" TEXT NOT NULL DEFAULT 'шмурдяк';
