-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('PREMIUM', 'GEMS');

-- AlterTable
ALTER TABLE "Advertisement" ALTER COLUMN "due" SET DEFAULT (NOW() + INTERVAL '1 day');

-- AlterTable
ALTER TABLE "Payments" ADD COLUMN     "type" "PaymentType" NOT NULL DEFAULT 'PREMIUM';

-- AlterTable
ALTER TABLE "UserBot" ALTER COLUMN "location" SET DEFAULT ST_SetSRID(ST_MakePoint(0, 0), 4326);
