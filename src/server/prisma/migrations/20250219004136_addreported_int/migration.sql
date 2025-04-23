/*
  Warnings:

  - Added the required column `reported` to the `UserBot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserBot" ADD COLUMN     "reported" INTEGER NOT NULL,
ALTER COLUMN "location" SET DEFAULT ST_SetSRID(ST_MakePoint(0, 0), 4326);
