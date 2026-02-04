-- AlterEnum
ALTER TYPE "ContractStatus" ADD VALUE 'COMPLETED';

-- DropIndex
DROP INDEX "BookingRequest_listingId_tenantId_status_key";

-- CreateIndex
CREATE INDEX "BookingRequest_listingId_tenantId_idx" ON "BookingRequest"("listingId", "tenantId");
