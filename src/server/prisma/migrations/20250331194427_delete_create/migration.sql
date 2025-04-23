/*
  Warnings:

  - You are about to drop the column `createdAt` on the `ViewedProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Advertisement" ALTER COLUMN "due" SET DEFAULT (NOW() + INTERVAL '1 day');

-- AlterTable
ALTER TABLE "UserBot" ALTER COLUMN "location" SET DEFAULT ST_SetSRID(ST_MakePoint(0, 0), 4326);

-- AlterTable
ALTER TABLE "ViewedProfile" DROP COLUMN "createdAt";
