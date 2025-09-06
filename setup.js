// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require("child_process");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

console.log("🚀 Setting up FeedbackHub - Advanced Security Edition...\n");

// Check if .env file exists
const envPath = path.join(process.cwd(), ".env");
if (!fs.existsSync(envPath)) {
  console.log("📝 Creating .env file...");
  const envContent = `# Database
DATABASE_URL="file:./dev.db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production-${Math.random()
    .toString(36)
    .substring(2, 15)}"

# Admin Credentials (for initial setup)
ADMIN_EMAIL="admin@feedbackhub.com"
ADMIN_PASSWORD="Admin123!@#"

# Security
ENCRYPTION_KEY="${Math.random().toString(36).substring(2, 34)}"
JWT_SECRET="${Math.random().toString(36).substring(2, 34)}"

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# CORS
ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"
`;
  fs.writeFileSync(envPath, envContent);
  console.log("✅ .env file created with secure defaults");
} else {
  console.log("✅ .env file already exists");
}

// Install dependencies
console.log("\n📦 Installing dependencies...");
try {
  execSync("npm install", { stdio: "inherit" });
  console.log("✅ Dependencies installed");
} catch (error) {
  console.error("❌ Failed to install dependencies:", error.message);
  process.exit(1);
}

// Generate Prisma client
console.log("\n🔧 Generating Prisma client...");
try {
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("✅ Prisma client generated");
} catch (error) {
  console.error("❌ Failed to generate Prisma client:", error.message);
  process.exit(1);
}

// Run database migrations
console.log("\n🗄️ Setting up database...");
try {
  execSync("npx prisma db push", { stdio: "inherit" });
  console.log("✅ Database setup complete");
} catch (error) {
  console.error("❌ Failed to setup database:", error.message);
  process.exit(1);
}

console.log("\n🎉 Setup complete! You can now run:");
console.log("   npm run dev");
console.log("\n📊 Access your feedback system at:");
console.log("   http://localhost:3000 - Main feedback form");
console.log("   http://localhost:3000/dashboard - Admin dashboard");
console.log("   http://localhost:3000/admin/login - Admin login");
console.log("\n🔐 Security Features:");
console.log("   • Advanced authentication system");
console.log("   • Rate limiting and DDoS protection");
console.log("   • Input validation and sanitization");
console.log("   • Security headers and CSP");
console.log("   • Audit logging and monitoring");
console.log("   • Session management");
console.log("\n💡 Features available:");
console.log("   • Beautiful feedback form with star ratings");
console.log("   • Comprehensive analytics dashboard");
console.log("   • Data filtering and search");
console.log("   • Multiple export formats (CSV, Excel, PDF)");
console.log("   • Sentiment analysis");
console.log("   • Real-time data visualization");
console.log("   • Power BI-like analytics");
console.log("   • Protected admin routes");
console.log("   • Error handling and 404 pages");
console.log("   • SEO optimization");
console.log("\n🔑 Default Admin Credentials:");
console.log("   Email: admin@feedbackhub.com");
console.log("   Password: Admin123!@#");
console.log("\n⚠️  IMPORTANT: Change default credentials in production!");
