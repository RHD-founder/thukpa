import { seedInitialData } from "./setup-admin";

async function main() {
  try {
    console.log("🌱 Seeding database...");
    await seedInitialData();
    console.log("✅ Database seeded successfully");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
