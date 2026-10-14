import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import AdminUser from '../src/models/AdminUser.js';

// Resolve project root and load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(projectRoot, '.env') });

// Zod Schema to validate environment variables
const envSchema = z.object({
  MONGODB_URI: z.string({
    required_error: 'MONGODB_URI',
  }).min(1, 'MONGODB_URI'),
  ADMIN_EMAIL: z.string().trim().email().optional(),
  ADMIN_USER: z.string().trim().min(1).optional(),
  ADMIN_PASSWORD: z.string().min(1).optional(),
  ADMIN_PASS: z.string().min(1).optional(),
  ADMIN_NAME: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  if (!data.ADMIN_EMAIL && !data.ADMIN_USER) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ADMIN_EMAIL or ADMIN_USER',
    });
  }
  if (!data.ADMIN_PASSWORD && !data.ADMIN_PASS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ADMIN_PASSWORD or ADMIN_PASS',
    });
  }
});

export async function seedAdminUser() {
  // Validate environment variables using Zod
  const validation = envSchema.safeParse(process.env);
  if (!validation.success) {
    const missingVars = validation.error.issues
      .map((issue) => issue.message)
      .filter(Boolean);
    console.error(`Missing required environment variable(s): ${missingVars.join(', ')}`);
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;
  const rawEmailOrUser = (process.env.ADMIN_EMAIL || process.env.ADMIN_USER || '').trim();
  const plainPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS || '';
  const adminName = (process.env.ADMIN_NAME || process.env.ADMIN_USER || 'Administrator').trim();

  // Normalize email and username
  const email = (
    rawEmailOrUser.includes('@')
      ? rawEmailOrUser
      : `${rawEmailOrUser}@doinikjamunarkantho.com`
  ).toLowerCase();

  const username = (
    process.env.ADMIN_USER ||
    (rawEmailOrUser.includes('@') ? rawEmailOrUser.split('@')[0] : rawEmailOrUser)
  ).trim().toLowerCase();

  // Connect to MongoDB
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    autoIndex: true,
  });

  try {
    // 1. Find by email (lowercased)
    let admin = await AdminUser.findOne({ email });

    // Fallback: If not found by email, check if legacy seeded user with matching username exists
    if (!admin && username) {
      admin = await AdminUser.findOne({ username });
    }

    if (!admin) {
      // 2. If not found -> create with role "admin", isActive true, bcrypt-hashed password (cost 12)
      const passwordHash = await bcrypt.hash(plainPassword, 12);
      await AdminUser.create({
        username,
        email,
        name: adminName,
        passwordHash,
        role: 'admin',
        isActive: true,
      });
    } else {
      // 3. If found -> keep it, make sure role is "admin", isActive is true, email is set
      let needsSave = false;

      if (admin.role !== 'admin') {
        admin.role = 'admin';
        needsSave = true;
      }

      if (admin.isActive !== true) {
        admin.isActive = true;
        needsSave = true;
      }

      if (admin.email !== email) {
        admin.email = email;
        needsSave = true;
      }

      if (admin.name !== adminName && adminName) {
        admin.name = adminName;
        needsSave = true;
      }

      // Update password hash ONLY if the .env password no longer matches the stored hash
      const isMatch = await bcrypt.compare(plainPassword, admin.passwordHash);
      if (!isMatch) {
        admin.passwordHash = await bcrypt.hash(plainPassword, 12);
        needsSave = true;
      }

      if (needsSave) {
        await admin.save();
      }
    }

    // Print ONLY: "Admin ready: <email>" (never print password or secret)
    console.log(`Admin ready: ${email}`);
  } finally {
    await mongoose.disconnect();
  }
}

// Execute directly if run as main CLI script
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  seedAdminUser().catch((err) => {
    console.error(`Failed to seed admin: ${err?.message || 'Unknown error'}`);
    process.exit(1);
  });
}
