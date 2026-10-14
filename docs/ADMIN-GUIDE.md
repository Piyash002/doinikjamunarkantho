# Dainik Jamunar Kantho — Editorial & Administration Guide

Welcome to the **Dainik Jamunar Kantho** Editorial & Admin Suite (`/admin`). This application is engineered mobile-first to empower journalists, editors, and administrators to produce, organize, and publish breaking news from any device—whether on a 360px smartphone in the field, a tablet, or a desktop workstation.

---

## Table of Contents
1. [User Roles & Permissions Matrix](#1-user-roles--permissions-matrix)
2. [Logging In & Mobile Navigation](#2-logging-in--mobile-navigation)
3. [Creating & Publishing News Articles](#3-creating--publishing-news-articles)
4. [Using the Tiptap Rich Text Editor](#4-using-the-tiptap-rich-text-editor)
5. [Media Library & Image Optimization](#5-media-library--image-optimization)
6. [Homepage Manager & Section Pinning](#6-homepage-manager--section-pinning)
7. [Categories, Tags & Author Bylines](#7-categories-tags--author-bylines)
8. [Advertising & Monetization Slots](#8-advertising--monetization-slots)
9. [Trending Keywords & Breaking News Ticker](#9-trending-keywords--breaking-news-ticker)
10. [Site Settings & SEO Defaults](#10-site-settings--seo-defaults)
11. [Activity Audit Trail](#11-activity-audit-trail)
12. [Automated Scheduled Post Publishing](#12-automated-scheduled-post-publishing)

---

## 1. User Roles & Permissions Matrix

The portal enforces strict Role-Based Access Control (RBAC) both in the user interface and at the API route layer:

| Feature / Action | Admin | Editor | Reporter |
| :--- | :---: | :---: | :---: |
| **Create & Edit Own Posts (Draft)** | ✅ | ✅ | ✅ |
| **Publish Posts Live** | ✅ | ✅ | ❌ *(Drafts only)* |
| **Edit / Trash Other Users' Posts** | ✅ | ✅ | ❌ |
| **Manage Media Library & Upload Assets** | ✅ | ✅ | ✅ |
| **Manage Categories & Tags** | ✅ | ✅ | ❌ |
| **Manage Author Profiles** | ✅ | ✅ | ❌ |
| **Homepage Layout Manager & Pinning** | ✅ | ❌ | ❌ |
| **Advertisement Banners** | ✅ | ❌ | ❌ |
| **Trending Keywords & Breaking Ticker** | ✅ | ✅ | ❌ |
| **Static Pages (About, Privacy, Terms)** | ✅ | ✅ | ❌ |
| **Site Settings (Logo, Favicon, Social)** | ✅ | ❌ | ❌ |
| **Users & Roles Administration** | ✅ | ❌ | ❌ |
| **View Activity Audit Trail** | ✅ | ✅ | ❌ |

---

## 2. Logging In & Mobile Navigation

### Accessing the Panel
Navigate to `/admin/login` on any modern browser. Enter your username/email and password.
- **Rate Limiting**: Accounts are safeguarded with sliding-window brute-force rate limiting.
- **Intended Redirects**: Accessing a protected URL like `/admin/posts/new` while unauthenticated automatically redirects you back to that page upon successful login.
- **PWA Installation**: On mobile Chrome and Safari, select **"Add to Home Screen"** to run the Admin Panel as a standalone full-screen app with 100dvh viewport and iOS notch safe-area support.

### Responsive Navigation
- **Desktop (≥1024px)**: Fixed left sidebar categorized into *Overview*, *Content*, *Site*, and *System*. Expand or collapse to icon-only mode with the toggle. Use `⌘K` or `Ctrl+K` for the Global Quick Search Command Palette.
- **Tablet (768px – 1023px)**: Icon-only rail that slides out as a drawer when tapped.
- **Mobile (<768px)**:
  - Sticky top bar with quick-action "+ New Post", hamburger menu, and user avatar.
  - Slide-in navigation drawer with focus trapping and backdrop dismissal.
  - Fixed bottom navigation bar with 5 primary touch targets (≥44x44px): **Dashboard**, **Posts**, **+ Create**, **Media**, and **More**.

---

## 3. Creating & Publishing News Articles

Navigate to **Posts → New Post** (`/admin/posts/new`).

### Layout Architecture
- **Desktop**: 2-column view (Article Content & Editor on the left; Publishing Settings, Category, Media, and SEO on the right).
- **Mobile**: Single-column view with touch-friendly accordion sections and a **sticky bottom action bar** containing **Save Draft**, **Preview**, and **Publish Now** buttons.

### Core Article Fields
1. **Title & Headline**: Type your headline in Bangla or English. The slug automatically generates with Unicode Bangla preservation (e.g., `jamuna-nodir-pani-briddhi-12345`). You can click the lock icon to manually edit the slug.
2. **Lead / Highlights**: 1-2 sentence lead paragraph shown beneath the headline on article pages.
3. **Excerpt / Summary**: Short summary for social share cards and mobile news lists.
4. **Primary Category & Subcategory**: Select the topic.
5. **Regional News (সারাদেশ)**: When selecting the `সারাদেশ` (Countrywide) category, cascading dropdowns for **Division**, **District**, and **Upazila** appear automatically.
6. **Featured Image**:
   - Upload directly from your mobile camera or gallery, or choose from the Media Library.
   - Enter descriptive Caption and Alt Text for SEO and accessibility.
7. **Publishing Status**:
   - **Draft**: Saved privately.
   - **Published**: Available immediately to public readers.
   - **Scheduled**: Set a future date/time. The post automatically goes live when the time arrives.
8. **Editorial Flags**:
   - **Breaking**: Adds the post to the top breaking ticker.
   - **Featured**: Highlights the post in section hero slots.
   - **Trending**: Flags the post for inclusion in trending feeds.
9. **SEO Character Counters & Google Preview**:
   - Real-time character counts for Meta Title (recommended 50-60 characters) and Meta Description (recommended 120-160 characters).
   - Live Google search snippet preview shows exactly how the article will appear on mobile SERPs.
10. **Autosave & Revision History**:
    - The editor automatically saves drafts every 30 seconds and when navigating between fields.
    - Up to 20 historical revisions are retained. Click **Revision History** to view timestamps, word counts, and restore any previous version.
    - **Optimistic Locking**: If another editor modifies the article simultaneously, the server detects version mismatch and warns you before overwriting.
11. **Live Preview**:
    - Click **Preview** to generate a cryptographically signed HMAC preview token and inspect the draft in the public newspaper layout in a new tab.

---

## 4. Using the Tiptap Rich Text Editor

The custom Tiptap editor is built with mobile journalism in mind:
- **Sticky Floating Toolbar**: Horizontally scrollable toolbar that remains accessible above the mobile keyboard.
- **Formatting Tools**: Bold, Italic, Underline, Heading 2 (`<h2>`), Heading 3 (`<h3>`), Blockquote, Bullet List, Ordered List, Horizontal Rule.
- **Media Insertion**:
  - Click **Image** to insert directly from the Media Library or Cloudinary upload.
  - Click **YouTube** to embed video interviews simply by pasting the YouTube URL.
- **Tables**: Insert dynamic tables with row/column insertion and deletion buttons.
- **Sanitization & Paste Cleaning**: Rich text pasted from Microsoft Word, Google Docs, or other news portals is automatically sanitized—removing harmful scripts, proprietary style tags, and broken font definitions while preserving semantic markup.
- **Reading Time Metric**: Real-time word count and estimated reading time (calculated at ~180 words per minute for Bangla/English).

---

## 5. Media Library & Image Optimization

Navigate to **Media** (`/admin/media`).

### Uploading Assets
- **Drag-and-Drop & File Picker**: Upload single or multiple images simultaneously with real-time percentage progress bars.
- **Mobile Camera / Gallery**: Directly snap photos from your smartphone camera during field reporting.
- **Client-Side Compression**: High-resolution smartphone photos (often 12–48 Megapixels) are automatically downscaled on the client side to a maximum of 2000px and compressed to 0.85 quality WebP/JPEG before uploading. This saves bandwidth and speeds up uploads on mobile 4G networks.

### Asset Management
- **Search & Filter**: Search files by filename or alt text.
- **Direct Copy**: Click to copy the CDN URL to clipboard.
- **Safe Deletion**: The system checks if an image is currently referenced as a featured image in published articles. If in use, the system warns you to prevent broken images.

---

## 6. Homepage Manager & Section Pinning

Navigate to **Homepage** (`/admin/homepage`).

The Homepage Manager controls exactly which articles appear in each section of the public front page:
- **Lead Hero Section (শীর্ষ সংবাদ)**: Slot 1 (Primary Hero), Slot 2–5 (Secondary Lead items).
- **Category Blocks**: Politics (রাজনীতি), National (জাতীয়), International (আন্তর্জাতিক), Sports (খেলাধুলা), Economy (অর্থনীতি), Entertainment (বিনোদন), Technology (তথ্যপ্রযুক্তি), Lifestyle (জীবনযাপন).

### How Slot Pinning Works:
1. Each slot displays an **"Auto"** or **"Pinned"** badge.
2. When a slot is **Auto**, the system dynamically displays the latest published article from that category.
3. To pin a specific breaking story or investigation:
   - Click **"Pin Post"** or **"Replace"** on the target slot.
   - Search by headline and click to assign.
   - The slot is now locked with that article.
4. **Reordering**: Drag-and-drop slots using the touch handles or tap the **Up (↑)** and **Down (↓)** buttons on mobile.
5. **Publish to Live**: Tap **"Publish Homepage"**. This atomically commits the configuration and executes Next.js On-Demand Revalidation (`revalidatePath('/')`), making the changes visible to public visitors in milliseconds without waiting for cache expiry.

---

## 7. Categories, Tags & Author Bylines

### Categories (`/admin/categories`)
- Reorder categories using touch drag-and-drop handles. The order determines the public navigation bar sequence.
- Configure layout styles per category: **Grid**, **Lead with List**, or **Cards**.
- Toggle visibility for the main header navigation and homepage sections.

### Tags (`/admin/tags`)
- View tag usage counts across published articles.
- **Merge Tags**: Consolidate duplicate tags (e.g., merging `নির্বাচন-২০২৬` into `জাতীয়-নির্বাচন`) across all existing articles in a single operation.
- Rename or delete tags cleanly.

### Authors (`/admin/authors`)
- Maintain profiles for correspondents, columnists, and staff journalists.
- Assign avatar photos, designations (e.g., *সিনিয়র রিপোর্টার*), and author bios.
- Track total published article count per author.

---

## 8. Advertising & Monetization Slots

Navigate to **Ads** (`/admin/ads`).

Manage promotional banners across predetermined standard newspaper placements:
- `header-below`: Below main site navigation
- `sidebar`: Right rail sidebar
- `between-sections`: Separator between homepage category blocks
- `sticky-bottom`: Mobile sticky bottom anchor banner
- `in-article`: Inside article body text after paragraph 3
- `article-sidebar-top` & `article-sidebar-mid`: Article page sidebars

### Configuration Options
- Image banner upload with target click URL.
- Responsive size recommendations (e.g., 728x90 desktop, 300x250 mobile).
- Campaign start and end dates with automatic expiration.
- Instant active toggle switch.
- Impression and click counters.

---

## 9. Trending Keywords & Breaking News Ticker

Navigate to **Trending & Breaking** (`/admin/trending`).
- **Breaking News Banner**: Toggle the top red breaking ticker on/off and provide a live headline and link.
- **Trending Topics Chips**: Add, remove, and reorder hot keyword chips displayed under the main portal header (e.g., `#বাজেট`, `#বিশ্বকাপ`, `#নির্বাচন`).

---

## 10. Site Settings & SEO Defaults

Navigate to **Settings** (`/admin/settings`). Accessible by Administrators only:
- **General**: Site name, logo, mobile logo, favicon, Chief Editor designation.
- **Contact**: Office address, hotline phone number, newsroom email.
- **Social Media**: Facebook page, YouTube channel, X (Twitter), Instagram, Telegram.
- **SEO Defaults**: Default OpenGraph sharing image, global meta title fallback, and meta description.
- **Integrations**: Google Analytics 4 Measurement ID, WhatsApp News Channel link, and Google Play Store app link.

---

## 11. Activity Audit Trail

Navigate to **Activity Log** (`/admin/activity`).
- Every administrative event is immutably recorded: article creation, edits, publishing, trashing, category updates, login timestamps, and settings modifications.
- Filter by user, entity type, and action.
- Inspect detailed change metadata, client IP addresses, and user agent signatures.

---

## 12. Automated Scheduled Post Publishing

Articles scheduled for future release are published automatically through two reliable mechanisms:

1. **Lazy Publishing on Read**: Whenever any public reader visits the site or an article, the system checks for any scheduled articles whose `publishedAt` timestamp has elapsed and marks them published.
2. **Cron Micro-Service**:
   - Endpoint: `/api/cron/publish-scheduled`
   - Authentication: Protected by the `CRON_SECRET` header or query parameter:
     ```bash
     curl -X GET "https://yourdomain.com/api/cron/publish-scheduled?secret=YOUR_CRON_SECRET"
     ```
   - **Vercel Cron Configuration**: Add to your `vercel.json`:
     ```json
     {
       "crons": [
         {
           "path": "/api/cron/publish-scheduled",
           "schedule": "* * * * *"
         }
       ]
     }
     ```

---

*For technical assistance or editorial account provisioning, contact the Dainik Jamunar Kantho System Administrator.*
