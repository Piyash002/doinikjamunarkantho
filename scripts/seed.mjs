import fs from "node:fs";
import path from "node:path";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import slugify from "slugify";

const rootDir = process.cwd();
const envPath = path.join(rootDir, ".env");

if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!key) continue;
    process.env[key] = rest.join("=");
  }
}

const categories = [
  "জাতীয়",
  "রাজনীতি",
  "অর্থনীতি",
  "এক্সক্লুসিভ",
  "সারাদেশ",
  "আন্তর্জাতিক",
  "খেলা",
  "বিনোদন",
  "স্বাস্থ্য",
  "লাইফস্টাইল",
  "তথ্যপ্রযুক্তি",
  "অটোমোবাইল",
  "ট্যুরিজম",
  "শিক্ষা",
  "জবস",
  "প্রবাস",
  "মতামত",
  "ধর্ম",
  "ক্যাম্পাস",
  "আইন-আদালত",
  "এভিয়েশন",
  "গণমাধ্যম",
  "ভিডিও",
  "কৃষি ও প্রকৃতি",
  "কনভার্টার",
];

const seedCategoryDocs = categories.map((label, index) => ({
  name_bn: label,
  name_en: label.replace(/\s+/g, " ").trim(),
  slug: slugify(label, { lower: true, strict: true }),
  order: index + 1,
  showInNav: true,
  showOnHome: true,
  homeLayout: index % 2 === 0 ? "hero" : "grid-4",
  isActive: true,
}));

async function seed() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing. Add it to .env before running the seed script.");
  }

  await mongoose.connect(mongoUri);

  const AdminUser = mongoose.models.AdminUser || mongoose.model("AdminUser", new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "editor"], default: "admin" },
    isActive: { type: Boolean, default: true },
  }, { timestamps: true }));

  const Category = mongoose.models.Category || mongoose.model("Category", new mongoose.Schema({
    name_bn: String,
    name_en: String,
    slug: { type: String, unique: true },
    order: Number,
    showInNav: Boolean,
    showOnHome: Boolean,
    homeLayout: String,
    isActive: Boolean,
  }, { timestamps: true }));

  await AdminUser.deleteMany({});
  const username = process.env.ADMIN_USER || "admin";
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASS || "admin@123", 10);
  await AdminUser.create({ username, passwordHash, role: "admin", isActive: true });

  await Category.deleteMany({});
  await Category.insertMany(seedCategoryDocs);

  console.log("Seed completed: admin user and category records created.");
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
