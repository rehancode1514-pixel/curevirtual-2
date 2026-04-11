const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.appointment.updateMany({
    where: {
      status: 'PENDING_PAYMENT'
    },
    data: {
      status: 'APPROVED'
    }
  });
  console.log(`Updated ${updated.count} appointments from PENDING_PAYMENT to APPROVED.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
