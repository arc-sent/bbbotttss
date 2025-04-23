-- AlterTable
ALTER TABLE "Advertisement" ADD COLUMN     "due" TIMESTAMP(3) NOT NULL DEFAULT (NOW() + INTERVAL '1 day');

-- AlterTable
ALTER TABLE "UserBot" ALTER COLUMN "location" SET DEFAULT ST_SetSRID(ST_MakePoint(0, 0), 4326);
