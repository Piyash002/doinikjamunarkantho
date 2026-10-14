# Dainik Jamunar Kantho (দৈনিক যমুনার কণ্ঠ)

A modern, mobile-first newspaper web application built with Next.js (App Router), Tailwind CSS v4, Mongoose, and Cloudinary.

## Getting Started

### 1. Environment Setup
Copy the environment variables template:
```bash
cp .env.example .env
```
Populate your database credentials and admin parameters in `.env`.

### 2. Run Development Server
```bash
npm run dev
```
> **Note:** The `predev` lifecycle script automatically runs `npm run seed:admin` before starting the development server, ensuring the admin account configured in `.env` is always provisioned and up-to-date.

### 3. Production Deployment
In production (`NODE_ENV=production`), `predev` is not executed. Instead, **run `npm run seed:admin` once after deploy** to ensure your administrator account is properly seeded or synchronized:
```bash
npm run build
npm run seed:admin
npm run start
```

## Admin Seeding Scripts
- `npm run seed:admin`: Automatically reads admin credentials from `.env` and idempotently upserts the administrator account (cost 12 bcrypt hashing, never exposes secrets in output).
- `npm run seed`: Sequentially seeds the admin user (`scripts/seed-admin.js`) and portal demo datasets (`scripts/seed-demo.js`).

## Editorial & Admin Suite
- Admin Panel: `http://localhost:3000/admin`
- Login Page: `http://localhost:3000/admin/login`
- Detailed Documentation: See [`docs/ADMIN-GUIDE.md`](./docs/ADMIN-GUIDE.md) for full guide on article publishing, Tiptap editor, media management, homepage pinning, and RBAC roles.
