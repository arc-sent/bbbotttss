/*
  Warnings:

  - You are about to drop the column `premiumType` on the `UserBot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserBot" DROP COLUMN "premiumType",
ALTER COLUMN "location" SET DEFAULT ST_SetSRID(ST_MakePoint(0, 0), 4326);
