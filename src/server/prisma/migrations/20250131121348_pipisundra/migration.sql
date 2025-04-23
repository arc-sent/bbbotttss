-- CreateTable
CREATE TABLE "UserBot" (
    "idPrisma" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL DEFAULT 'шмурдяк',
    "photo" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "UserBot_pkey" PRIMARY KEY ("idPrisma")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserBot_id_key" ON "UserBot"("id");
