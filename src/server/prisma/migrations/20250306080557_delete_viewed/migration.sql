/*
  Warnings:

  - You are about to drop the column `viewed` on the `UserBot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserBot" DROP COLUMN "viewed",
ALTER COLUMN "location" SET DEFAULT ST_SetSRID(ST_MakePoint(0, 0), 4326);
