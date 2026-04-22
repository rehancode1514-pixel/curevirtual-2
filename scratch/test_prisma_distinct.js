const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testInbox() {
  try {
    const userId = "1"; // dummy
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: [
        { conversationId: "asc" },
        { createdAt: "desc" }
      ],
      distinct: ["conversationId"],
    });
    console.log("Success! Inbox items retrieved:", messages.length);
  } catch (err) {
    console.error("Caught expected error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testInbox();
