// Script to apply registration approval schema changes directly via Prisma
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Applying registration approval schema changes...\n');

  // Use $executeRawUnsafe to apply DDL statements
  const statements = [
    // Add approvalStatus to User
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "approvalStatus" TEXT NOT NULL DEFAULT 'NOT_REQUIRED'`,

    // Create RegistrationRequest table
    `CREATE TABLE IF NOT EXISTS "RegistrationRequest" (
      "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "userId"          TEXT NOT NULL,
      "role"            TEXT NOT NULL,
      "status"          TEXT NOT NULL DEFAULT 'PENDING',
      "rejectionReason" TEXT,
      "licenseImageUrl" TEXT NOT NULL,
      "licenseFilePath" TEXT NOT NULL,
      "submittedData"   JSONB NOT NULL,
      "reviewedBy"      TEXT,
      "reviewedAt"      TIMESTAMPTZ,
      "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT "RegistrationRequest_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "RegistrationRequest_userId_key" UNIQUE ("userId"),
      CONSTRAINT "RegistrationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS "RegistrationRequest_status_idx" ON "RegistrationRequest"("status")`,
    `CREATE INDEX IF NOT EXISTS "RegistrationRequest_role_idx"   ON "RegistrationRequest"("role")`,
  ];

  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`✅ OK: ${sql.slice(0, 60)}...`);
    } catch (err) {
      console.error(`❌ FAILED: ${sql.slice(0, 60)}...\n   Reason: ${err.message}`);
    }
  }

  console.log('\n✅ Migration complete. Regenerating Prisma client...');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
