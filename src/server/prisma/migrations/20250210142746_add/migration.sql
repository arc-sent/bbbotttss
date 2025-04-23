-- AlterTable
ALTER TABLE "UserBot" ADD COLUMN     "pendingProfile" TEXT[] DEFAULT ARRAY[]::TEXT[];
