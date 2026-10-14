# Dhaka Post-inspired Design System

## 1. Reference readout from the provided screenshots

The reference is built around a dense Bangla editorial layout: dark navy sticky top bar, oversized white-logo wordmark, pale gray page background, thin separator lines, a warm gold accent for section titles, and a rigid 3-column desktop editorial grid. The overall feel is clean and formal, with a stronger “broadsheet” than “modern magazine” posture.

### Core palette extracted from the reference

```css
:root {
  color-scheme: light;
  --page: #edf1f4;
  --surface: #ffffff;
  --surface-soft: #f7f8fa;
  --ink: #1b2d3a;
  --muted: #5f6f7f;
  --line: #d8e0e8;
  --navy: #0a2b3a;
  --navy-deep: #072230;
  --teal: #1b7d95;
  --accent: #d6a74f;
  --soft-accent: #f3e9d6;
  --link: #1d5ea8;
  --button: #0d4b6e;
  --section-accent: #d6a74f;
  --shadow: 0 12px 35px rgb(10 43 58 / 12%);
}

.portal[data-theme="dark"] {
  color-scheme: dark;
  --page: #0f1720;
  --surface: #172a36;
  --surface-soft: #203340;
  --ink: #edf3f8;
  --muted: #b4c3ce;
  --line: #365062;
  --navy: #0a2b3a;
  --navy-deep: #071d2b;
  --teal: #79d0e6;
  --accent: #e7bd67;
  --soft-accent: #2d332a;
  --link: #9ec9ff;
  --button: #153d56;
  --section-accent: #e7bd67;
  --shadow: 0 16px 42px rgb(4 10 18 / 30%);
}
```

### Tailwind theme tokens

```css
@theme {
  --font-bengali: "Noto Sans Bengali", "Hind Siliguri", "Bangla Sangam MN", sans-serif;
  --color-brand-navy: #0a2b3a;
  --color-brand-navy-deep: #072230;
  --color-brand-teal: #1b7d95;
  --color-brand-gold: #d6a74f;
  --color-brand-link: #1d5ea8;
  --color-brand-button: #0d4b6e;
  --color-page: #edf1f4;
  --color-surface: #ffffff;
  --color-surface-soft: #f7f8fa;
  --color-ink: #1b2d3a;
  --color-muted: #5f6f7f;
  --color-line: #d8e0e8;
  --color-shadow: rgb(10 43 58 / 12%);
}
```

## 2. Typography and type system

The closest visual match to the reference is `Noto Sans Bengali`, which provides the correct editorial warmth and rounded structure. It is loaded via `next/font/google` and exposed as `--font-bengali`.

### Type scale and rhythm

```css
:root {
  --font-bengali: "Noto Sans Bengali", "Hind Siliguri", "Bangla Sangam MN", sans-serif;
  --headline-size: clamp(2.2rem, 2rem + 0.9vw, 3.4rem);
  --h2-size: clamp(1.55rem, 1.3rem + 0.7vw, 2.2rem);
  --section-size: 1.15rem;
  --card-title-size: 1.12rem;
  --body-size: 0.98rem;
  --meta-size: 0.78rem;
  --nav-size: 0.88rem;
}
```

Recommended text styles:
- Hero headline: 2.2–3.4rem, font-weight 700, line-height 1.2, color `var(--ink)`
- Card title: 1.1rem, font-weight 600–700, line-height 1.45
- Excerpt/body: 0.98rem, font-weight 400, line-height 1.7
- Section title: 1.15rem, font-weight 700, letter-spacing 0; left gold accent bar
- Nav items: 0.88rem, font-weight 500, line-height 1.4, white text on navy

## 3. Layout system

- Container max width: `1320px`
- Horizontal page padding: `24px` on desktop, `16px` on mobile
- Grid gaps: `20px`
- Border radius: `18px`
- Thin divider lines: `1px solid var(--line)`
- Card padding: `14px` to `18px`
- Shadow: `0 12px 35px rgb(10 43 58 / 12%)`
- Section accent line: `4px solid var(--section-accent)`

### Image ratios

- Hero: 16:9 or near-16:10 fitted image blocks
- Thumb/list: around 3:2 to 16:10 depending on layout density
- Square or compact cards should use 4:3 when necessary, but keep cropping tight and consistent

## 4. Component rules

### Header

- Sticky navy header with white text and logo block on the left
- Nav sits in the middle with active item underline using warm gold
- Right actions are theme switch, search, and hamburger
- Mobile version collapses nav into a full overlay with category chips and actions

### TrendingBar / chips

- Subtle bar below header with active chips in padded pills
- Border radius roughly `999px`
- Hover/active states use light background plus subtle border color

### SectionTitle

- Left gold vertical bar + bold category label
- Divider line under the title area
- Optional “আরও” link anchored to the right

### NewsCard variants

- HeroLead: large image with text below or beside it
- ListWithThumb: compact list item with image + headline
- GridCard: equal-height cards for category grids
- TextOnly: secondary list item with minimal extra styling

### SidebarTabs

- Tabs for “সর্বশেষ / জনপ্রিয়” in a two-button row
- Active state uses navy text on a soft surface, with a subtle border

### AdSlot

- Large horizontal ad banners across content width
- Sidebar ad slots align with the same card shell and padding rhythm

### Footer

- Navy or dark charcoal footer with white text and muted link groupings
- Social icons appear as rounded white or neutral pills, with a green WhatsApp CTA and a dark Play Store button

## 5. Responsiveness

- Desktop: three-column broadsheet layout with 1 large lead + side rail
- Tablet: content stack compresses while maintaining the same 2-tone editorial rhythm
- Mobile: nav collapses, cards stack, and tap targets remain large and readable

## 6. Dark mode behavior

- Theme preference persists using `localStorage` under `theme-preference`
- If no saved preference is found, the system preference is used automatically
- The `.portal[data-theme="dark"]` palette swaps the light values without changing structure

## 7. Implementation status

This design system is now reflected in the global theme variables in [app/globals.css](../app/globals.css), the font load in [app/layout.tsx](../app/layout.tsx), and the design documentation in this file.
