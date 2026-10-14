import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "দৈনিক যমুনা কণ্ঠ | সত্যের সঙ্গে, মানুষের পাশে",
  description:
    "বাংলাদেশ ও বিশ্বের সর্বশেষ সংবাদ, রাজনীতি, অর্থনীতি, খেলা ও বিনোদনের খবর পড়ুন দৈনিক যমুনা কণ্ঠে।",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  );
}
