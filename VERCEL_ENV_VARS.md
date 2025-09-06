# Vercel Environment Variables Setup

## 🔑 **Required Environment Variables for Vercel**

Copy these to your Vercel project → Settings → Environment Variables:

### **1. Database (Neon PostgreSQL)**

```bash
DATABASE_URL="postgresql://neondb_owner:npg_g5cMxDyr7fzP@ep-noisy-sky-a1sus6c4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:npg_g5cMxDyr7fzP@ep-noisy-sky-a1sus6c4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

### **2. PostgreSQL Parameters (Optional but recommended)**

```bash
PGHOST="ep-noisy-sky-a1sus6c4-pooler.ap-southeast-1.aws.neon.tech"
PGHOST_UNPOOLED="ep-noisy-sky-a1sus6c4.ap-southeast-1.aws.neon.tech"
PGUSER="neondb_owner"
PGDATABASE="neondb"
PGPASSWORD="npg_g5cMxDyr7fzP"
```

### **3. Vercel Postgres Templates (Optional)**

```bash
POSTGRES_URL="postgresql://neondb_owner:npg_g5cMxDyr7fzP@ep-noisy-sky-a1sus6c4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
POSTGRES_URL_NON_POOLING="postgresql://neondb_owner:npg_g5cMxDyr7fzP@ep-noisy-sky-a1sus6c4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
POSTGRES_USER="neondb_owner"
POSTGRES_HOST="ep-noisy-sky-a1sus6c4-pooler.ap-southeast-1.aws.neon.tech"
POSTGRES_PASSWORD="npg_g5cMxDyr7fzP"
POSTGRES_DATABASE="neondb"
POSTGRES_URL_NO_SSL="postgresql://neondb_owner:npg_g5cMxDyr7fzP@ep-noisy-sky-a1sus6c4-pooler.ap-southeast-1.aws.neon.tech/neondb"
POSTGRES_PRISMA_URL="postgresql://neondb_owner:npg_g5cMxDyr7fzP@ep-noisy-sky-a1sus6c4-pooler.ap-southeast-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require"
```

### **4. Neon Auth for Next.js (Optional)**

```bash
NEXT_PUBLIC_STACK_PROJECT_ID="63db5f8b-8b52-47f9-b568-8ac055c7f1b9"
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY="pck_b0hf5a7s7wx99qykx1hy1kgfjhwkexyzgx0824kwdgtq8"
STACK_SECRET_SERVER_KEY="ssk_spxedsw8rj9r842kydrqz4p98zry6d92sj3ca8ytwcktg"
```

### **5. NextAuth.js (REQUIRED)**

```bash
NEXTAUTH_URL="https://your-app-name.vercel.app"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
```

### **6. Admin Credentials (REQUIRED) - CORRECT ONES**

```bash
ADMIN_EMAIL="admin@feedbackhub.com"
ADMIN_PASSWORD="Admin123!@#"
```

### **7. Security Keys (REQUIRED)**

```bash
ENCRYPTION_KEY="your-32-character-encryption-key-here"
JWT_SECRET="your-jwt-secret-key-here"
```

## 🚀 **Deployment Steps**

1. **Push to GitHub:**

   ```bash
   git add .
   git commit -m "Add Neon database and fix admin credentials"
   git push
   ```

2. **Deploy to Vercel:**

   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add all environment variables above
   - Deploy!

3. **Update NEXTAUTH_URL:**
   - After deployment, update `NEXTAUTH_URL` to your actual Vercel URL
   - Example: `https://thukpa-feedback.vercel.app`

## ✅ **Current Status**

- ✅ App is working with Neon locally
- ✅ Database is seeded with admin user
- ✅ All features are functional
- ✅ Ready for Vercel deployment

## 🔧 **Generate New Secrets (Recommended)**

For production, generate new secrets:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY (32 characters)
openssl rand -hex 16
```

## 🔑 **Admin Login Credentials**

- **Email**: `admin@feedbackhub.com`
- **Password**: `Admin123!@#`
