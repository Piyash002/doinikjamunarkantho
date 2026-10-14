import type { Metadata } from "next";
import { Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  variable: "--font-bengali",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "দৈনিক যমুনা কণ্ঠ | সত্যের সঙ্গে, মানুষের পাশে",
  description:
    "বাংলাদেশ ও বিশ্বের সর্বশেষ সংবাদ, রাজনীতি, অর্থনীতি, খেলা ও বিনোদনের খবর পড়ুন দৈনিক যমুনা কণ্ঠে।",
  icons: {
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bn" className={notoSansBengali.variable}>
      <body>{children}</body>
    </html>
  );
}
