"use client";

import Image from "next/image";
import { useState } from "react";

type StickyArticleAdProps = {
  imageUrl: string;
  link: string;
};

export default function StickyArticleAd({ imageUrl, link }: StickyArticleAdProps) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <aside aria-label="বিজ্ঞাপন" className="article-sticky-ad">
      <button
        aria-label="বিজ্ঞাপন বন্ধ করুন"
        className="article-sticky-ad-close"
        onClick={() => setVisible(false)}
        type="button"
      >×</button>
      <a href={link || "#"} rel="sponsored noopener noreferrer" target="_blank">
        <Image alt="বিজ্ঞাপন" height={90} src={imageUrl} width={728} />
      </a>
    </aside>
  );
}
