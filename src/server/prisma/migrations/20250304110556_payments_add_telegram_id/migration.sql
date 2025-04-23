-- AlterTable
ALTER TABLE "Payments" ALTER COLUMN "telegramId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UserBot" ALTER COLUMN "location" SET DEFAULT ST_SetSRID(ST_MakePoint(0, 0), 4326);
