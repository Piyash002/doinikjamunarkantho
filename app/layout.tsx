import type { Metadata } from "next";
import { Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { getSiteOrigin } from "@/src/lib/seo";

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  variable: "--font-bengali",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: "দৈনিক যমুনা কণ্ঠ | সত্যের সঙ্গে, মানুষের পাশে",
  description:
    "বাংলাদেশ ও বিশ্বের সর্বশেষ সংবাদ, রাজনীতি, অর্থনীতি, খেলা ও বিনোদনের খবর পড়ুন দৈনিক যমুনা কণ্ঠে।",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    siteName: "দৈনিক যমুনা কণ্ঠ",
    locale: "bn_BD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={notoSansBengali.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme-preference') || localStorage.getItem('theme');
                  var isDark = saved === 'dark'; // By default light mode unless explicitly dark
                  var theme = isDark ? 'dark' : 'light';
                  document.documentElement.dataset.theme = theme;
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
