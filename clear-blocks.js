const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function clearAllBlocks() {
  try {
    console.log("🧹 Clearing all blocked devices...");

    // Clear blocked devices
    const blockedResult = await prisma.blockedDevice.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    console.log(`✅ Deactivated ${blockedResult.count} blocked devices`);

    // Clear threat events (optional - uncomment if needed)
    // const threatResult = await prisma.threatEvent.deleteMany({});
    // console.log(`✅ Deleted ${threatResult.count} threat events`);

    console.log("🎉 All blocks cleared! You can now access from any device.");
  } catch (error) {
    console.error("❌ Error clearing blocks:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllBlocks();
