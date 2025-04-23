/*
  Warnings:

  - You are about to drop the column `pendingProfile` on the `UserBot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserBot" DROP COLUMN "pendingProfile";

-- CreateTable
CREATE TABLE "PandigProfile" (
    "idPrisma" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "userId" TEXT NOT NULL,

    CONSTRAINT "PandigProfile_pkey" PRIMARY KEY ("idPrisma")
);

-- CreateIndex
CREATE UNIQUE INDEX "PandigProfile_id_key" ON "PandigProfile"("id");

-- AddForeignKey
ALTER TABLE "PandigProfile" ADD CONSTRAINT "PandigProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserBot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
