/*
  Warnings:

  - You are about to drop the column `id` on the `PandigProfile` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "PandigProfile_id_key";

-- AlterTable
ALTER TABLE "PandigProfile" DROP COLUMN "id";
