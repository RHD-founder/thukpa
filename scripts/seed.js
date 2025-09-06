// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🌱 Seeding database...");

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "admin@feedbackhub.com" },
    });

    if (existingAdmin) {
      console.log("Admin user already exists");
    } else {
      // Create admin user
      const hashedPassword = await bcrypt.hash("Admin123!@#", 12);

      const admin = await prisma.user.create({
        data: {
          email: "admin@feedbackhub.com",
          password: hashedPassword,
          name: "Admin User",
          role: "admin",
          isActive: true,
        },
      });

      console.log("Admin user created successfully:", admin.email);
    }

    // Create some sample feedback for demonstration
    const sampleFeedback = [
      {
        name: "John Doe",
        email: "john@example.com",
        rating: 5,
        comments: "Excellent service! The staff was very friendly and helpful.",
        category: "service",
        location: "New York",
        sentiment: "positive",
        status: "new",
        isAnonymous: false,
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        rating: 4,
        comments: "Good experience overall, but the food could be better.",
        category: "food",
        location: "Los Angeles",
        sentiment: "positive",
        status: "reviewed",
        isAnonymous: false,
      },
      {
        name: "Anonymous",
        email: null,
        rating: 2,
        comments:
          "Not satisfied with the service. Very slow and unprofessional.",
        category: "service",
        location: "Chicago",
        sentiment: "negative",
        status: "new",
        isAnonymous: true,
      },
    ];

    // Check if feedback already exists
    const existingFeedback = await prisma.feedback.findFirst();

    if (!existingFeedback) {
      await prisma.feedback.createMany({
        data: sampleFeedback,
      });

      console.log("Sample feedback created successfully");
    } else {
      console.log("Sample feedback already exists");
    }

    console.log("✅ Database seeded successfully");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
