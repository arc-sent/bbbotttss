/*
  Warnings:

  - Added the required column `location` to the `UserBot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserBot" ADD COLUMN     "location" GEOGRAPHY(Point, 4326) NOT NULL;
