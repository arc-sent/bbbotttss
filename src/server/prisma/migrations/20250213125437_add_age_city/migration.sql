/*
  Warnings:

  - Added the required column `age` to the `UserBot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `UserBot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lat` to the `UserBot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `long` to the `UserBot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxAge` to the `UserBot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `minAge` to the `UserBot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- CREATE EXTENSION postgis;

ALTER TABLE "UserBot" ADD COLUMN     "age" INTEGER NOT NULL,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "lat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "long" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "maxAge" INTEGER NOT NULL,
ADD COLUMN     "minAge" INTEGER NOT NULL;
