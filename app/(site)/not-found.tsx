import Link from "next/link";

export default function SiteNotFound() {
  return (
    <main className="portal article-portal">
      <section className="article-not-found">
        <span>৪০৪</span>
        <h1>খবরটি খুঁজে পাওয়া যায়নি</h1>
        <p>লিংকটি ভুল হতে পারে অথবা খবরটি সরিয়ে নেওয়া হয়েছে।</p>
        <Link href="/">হোমপেজে ফিরে যান</Link>
      </section>
    </main>
  );
}
