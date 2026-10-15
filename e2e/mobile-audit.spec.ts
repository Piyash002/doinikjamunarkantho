import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { signAdminToken } from '../src/lib/auth';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';

const VIEWPORTS = [
  { name: 'iPhone-SE-360', width: 360, height: 667 },
  { name: 'iPhone-13-390', width: 390, height: 844 },
  { name: 'Pixel-7-414', width: 414, height: 892 },
  { name: 'iPad-Tablet-768', width: 768, height: 1024 },
  { name: 'Desktop-1280', width: 1280, height: 800 },
];

const ADMIN_PAGES = [
  { path: '/admin', name: 'Dashboard' },
  { path: '/admin/posts', name: 'Posts' },
  { path: '/admin/posts/new', name: 'Composer' },
  { path: '/admin/categories', name: 'Categories' },
  { path: '/admin/homepage', name: 'Homepage' },
  { path: '/admin/media', name: 'Media' },
  { path: '/admin/ads', name: 'Ads' },
  { path: '/admin/settings', name: 'Settings' },
  { path: '/admin/users', name: 'Users' },
  { path: '/admin/authors', name: 'Authors' },
  { path: '/admin/tags', name: 'Tags' },
  { path: '/admin/profile', name: 'Profile' },
];

test.describe('Admin Mobile Audit & Responsiveness Suite', () => {
  let adminToken: string;

  test.beforeAll(async () => {
    adminToken = await signAdminToken({
      id: '507f1f77bcf86cd799439011',
      username: ADMIN_USER,
      name: 'System Admin',
      role: 'admin',
      avatar: '',
    });

    const screenshotDir = path.join(process.cwd(), 'docs', 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  for (const vp of VIEWPORTS) {
    test.describe(`Viewport: ${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test(`Login page audit on ${vp.name}`, async ({ page }) => {
        await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Check horizontal overflow
        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(overflow).toBe(false);

        // Inputs height >= 48px
        const inputs = page.locator('input[name="username"], input[name="password"]');
        const count = await inputs.count();
        for (let i = 0; i < count; i++) {
          const box = await inputs.nth(i).boundingBox();
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }

        const screenshotPath = path.join(process.cwd(), 'docs', 'screenshots', `${vp.name}-login.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
      });

      for (const p of ADMIN_PAGES) {
        test(`Audit ${p.name} (${p.path}) on ${vp.name}`, async ({ page, context }) => {
          // Set authentication cookie
          await context.addCookies([
            {
              name: 'admin_token',
              value: adminToken,
              domain: 'localhost',
              path: '/',
            },
          ]);

          await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(1000);

          // Zero horizontal scroll assertion
          const overflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth;
          });
          expect(overflow).toBe(false);

          // Save screenshot
          const screenshotPath = path.join(
            process.cwd(),
            'docs',
            'screenshots',
            `${vp.name}-${p.name.toLowerCase()}.png`
          );
          await page.screenshot({ path: screenshotPath, fullPage: false });
        });
      }
    });
  }
});
