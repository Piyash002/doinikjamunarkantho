import fs from 'node:fs';
import path from 'node:path';
import { test, expect, request as playwrightRequest, APIRequestContext } from '@playwright/test';

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key) process.env[key] = rest.join('=');
  }
}

import { signAdminToken } from '../src/lib/auth';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin@123';

test.describe('Admin Panel Security & RBAC Guardrails', () => {
  test('Unauthenticated API requests return 401 Unauthorized', async ({ request }) => {
    const postRes = await request.get(`${BASE_URL}/api/admin/posts`);
    expect(postRes.status()).toBe(401);

    const settingsRes = await request.get(`${BASE_URL}/api/admin/settings`);
    expect(settingsRes.status()).toBe(401);

    const usersRes = await request.get(`${BASE_URL}/api/admin/users`);
    expect(usersRes.status()).toBe(401);
  });

  test('Unauthenticated browser navigation to /admin redirects to /admin/login', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForURL('**/admin/login**', { timeout: 10000 });
    expect(page.url()).toContain('/admin/login');
  });

  test('Login fails with invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[type="text"], input[name="username"]', 'wronguser');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    const errorMsg = page.locator('text=Invalid');
    await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
  });

  test('Login succeeds with valid credentials and sets session', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[type="text"], input[name="username"]', ADMIN_USER);
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/admin', { timeout: 10000 });
    expect(page.url()).toBe(`${BASE_URL}/admin`);
  });

  test('Reporter role permissions: cannot access Settings or Users (403 Forbidden)', async ({ request }) => {
    // Generate a reporter token with valid ObjectId
    const reporterToken = await signAdminToken({
      id: '507f1f77bcf86cd799439012',
      username: 'reporter_user',
      name: 'Field Reporter',
      role: 'reporter',
      avatar: '',
    });

    const headers = {
      Cookie: `admin_token=${reporterToken}`,
      Authorization: `Bearer ${reporterToken}`,
    };

    const settingsRes = await request.put(`${BASE_URL}/api/admin/settings`, {
      headers,
      data: { siteName: 'Unauthorized Update' },
    });
    expect(settingsRes.status()).toBe(403);

    const usersRes = await request.get(`${BASE_URL}/api/admin/users`, { headers });
    expect(usersRes.status()).toBe(403);
  });
});

test.describe('Mobile-First Layout & Responsiveness', () => {
  const viewports = [
    { name: 'Small Phone (360x740)', width: 360, height: 740 },
    { name: 'iPhone 13 (390x844)', width: 390, height: 844 },
    { name: 'iPad / Tablet (768x1024)', width: 768, height: 1024 },
    { name: 'Desktop (1280x800)', width: 1280, height: 800 },
  ];

  for (const vp of viewports) {
    test(`No horizontal scroll and proper navigation at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.goto(`${BASE_URL}/admin/login`);
      await page.fill('input[type="text"], input[name="username"]', ADMIN_USER);
      await page.fill('input[type="password"]', ADMIN_PASS);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/admin', { timeout: 10000 });

      // Verify zero horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScroll).toBe(false);

      if (vp.width < 768) {
        // Mobile bottom navigation bar should be visible
        const bottomNav = page.locator('nav').filter({ hasText: 'Dashboard' }).last();
        await expect(bottomNav).toBeVisible();
      } else if (vp.width >= 1024) {
        // Desktop sidebar should be visible
        const sidebar = page.locator('aside');
        await expect(sidebar).toBeVisible();
      }
    });
  }

  test('Dark mode toggle alters root html element class', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[type="text"], input[name="username"]', ADMIN_USER);
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin', { timeout: 10000 });

    const darkToggle = page.locator('button[aria-label*="dark"], button[title*="dark"], button[title*="theme"]').first();
    if (await darkToggle.isVisible()) {
      const initialHasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      await darkToggle.click();
      const updatedHasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      expect(updatedHasDark).toBe(!initialHasDark);
    }
  });
});

test.describe('Post Lifecycle: Draft, Publish, Trash, Restore, and Delete', () => {
  let adminCookieHeader: { Cookie: string };
  let createdPostId: string | null = null;
  const uniqueTitle = `পরীক্ষামূলক সংবাদ প্রতিবেদন ${Date.now()}`;

  test.beforeAll(async () => {
    const adminToken = await signAdminToken({
      id: '507f1f77bcf86cd799439011',
      username: ADMIN_USER,
      name: 'System Admin',
      role: 'admin',
      avatar: '',
    });
    adminCookieHeader = {
      Cookie: `admin_token=${adminToken}`,
      Authorization: `Bearer ${adminToken}`,
    };
  });

  test('Create a new post in draft status', async ({ request }) => {
    // Get an existing category
    const catRes = await request.get(`${BASE_URL}/api/admin/categories`, { headers: adminCookieHeader });
    expect(catRes.ok()).toBeTruthy();
    const catData = await catRes.json();
    const categorySlug = catData.data?.[0]?.slug || 'national';

    // Create post
    const createRes = await request.post(`${BASE_URL}/api/admin/posts`, {
      headers: adminCookieHeader,
      data: {
        title: uniqueTitle,
        lead: 'এটি একটি টেস্ট লিড প্যারাগ্রাফ',
        excerpt: 'সংক্ষিপ্ত সারসংক্ষেপ',
        content: '<p>বিস্তারিত প্রতিবেদন বিষয়বস্তু এখানে সংরক্ষিত হচ্ছে।</p>',
        category: categorySlug,
        status: 'draft',
      },
    });

    expect(createRes.ok()).toBeTruthy();
    const createdData = await createRes.json();
    expect(createdData.success).toBe(true);
    expect(createdData.data.title).toBe(uniqueTitle);
    expect(createdData.data.status).toBe('draft');
    createdPostId = createdData.data._id;
  });

  test('Update / Edit the post and publish it', async ({ request }) => {
    expect(createdPostId).toBeTruthy();

    const updateRes = await request.put(`${BASE_URL}/api/admin/posts/${createdPostId}`, {
      headers: adminCookieHeader,
      data: {
        title: `${uniqueTitle} (সংশোধিত)`,
        status: 'published',
      },
    });

    expect(updateRes.ok()).toBeTruthy();
    const updatedData = await updateRes.json();
    expect(updatedData.success).toBe(true);
    expect(updatedData.data.status).toBe('published');
    expect(updatedData.data.title).toContain('সংশোধিত');
  });

  test('Soft delete (trash) the post', async ({ request }) => {
    expect(createdPostId).toBeTruthy();

    const trashRes = await request.delete(`${BASE_URL}/api/admin/posts/${createdPostId}`, {
      headers: adminCookieHeader,
    });
    expect(trashRes.ok()).toBeTruthy();
    const trashData = await trashRes.json();
    expect(trashData.success).toBe(true);
    expect(trashData.data.isDeleted).toBe(true);
  });

  test('Restore the post from trash', async ({ request }) => {
    expect(createdPostId).toBeTruthy();

    const restoreRes = await request.post(`${BASE_URL}/api/admin/posts/${createdPostId}/restore`, {
      headers: adminCookieHeader,
    });
    expect(restoreRes.ok()).toBeTruthy();
    const restoreData = await restoreRes.json();
    expect(restoreData.success).toBe(true);
    expect(restoreData.data.isDeleted).toBe(false);
  });

  test('Permanently delete the post', async ({ request }) => {
    expect(createdPostId).toBeTruthy();

    const permDeleteRes = await request.delete(`${BASE_URL}/api/admin/posts/${createdPostId}?permanent=true`, {
      headers: adminCookieHeader,
    });
    expect(permDeleteRes.ok()).toBeTruthy();
    const result = await permDeleteRes.json();
    expect(result.success).toBe(true);

    // Verify it is gone
    const fetchRes = await request.get(`${BASE_URL}/api/admin/posts/${createdPostId}`, {
      headers: adminCookieHeader,
    });
    expect(fetchRes.status()).toBe(404);
  });
});

test.describe('Scheduled Posts Cron Service', () => {
  test('Execute scheduled post publisher endpoint', async ({ request }) => {
    const cronRes = await request.get(`${BASE_URL}/api/cron/publish-scheduled`);
    expect(cronRes.ok()).toBeTruthy();
    const data = await cronRes.json();
    expect(data.success).toBe(true);
    expect(typeof data.data?.publishedCount).toBe('number');
  });
});
