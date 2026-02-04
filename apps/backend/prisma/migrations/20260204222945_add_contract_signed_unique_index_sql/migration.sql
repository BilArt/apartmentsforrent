-- Ensure only one SIGNED contract per listing
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_contract_signed_per_listing"
ON "Contract" ("listingId")
WHERE status = 'SIGNED';
