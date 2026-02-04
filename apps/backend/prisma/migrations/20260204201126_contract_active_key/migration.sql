/*
  Warnings:

  - A unique constraint covering the columns `[activeKey]` on the table `Contract` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "activeKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Contract_activeKey_key" ON "Contract"("activeKey");
