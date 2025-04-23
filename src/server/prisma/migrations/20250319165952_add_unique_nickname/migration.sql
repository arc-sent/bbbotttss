/*
  Warnings:

  - A unique constraint covering the columns `[nickname]` on the table `Chanels` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "UserBot" ALTER COLUMN "location" SET DEFAULT ST_SetSRID(ST_MakePoint(0, 0), 4326);

-- CreateIndex
CREATE UNIQUE INDEX "Chanels_nickname_key" ON "Chanels"("nickname");
