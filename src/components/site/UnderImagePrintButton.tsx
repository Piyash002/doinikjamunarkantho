"use client";

export function RetroPrinterIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`${className} shrink-0`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Top Paper */}
      <rect x="5.5" y="1.5" width="9" height="6" rx="0.5" fill="#ffffff" />
      <line x1="7" y1="3.5" x2="13" y2="3.5" stroke="#cbd5e1" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="7" y1="5" x2="11.5" y2="5" stroke="#cbd5e1" strokeWidth="0.8" strokeLinecap="round" />

      {/* Main Printer Body (Slate / Purple) */}
      <rect x="2" y="6" width="16" height="8" rx="1.5" fill="#524e6e" />
      <rect x="3" y="6.8" width="14" height="1.2" rx="0.5" fill="#3b3752" opacity="0.4" />

      {/* Green Power Light */}
      <circle cx="15.2" cy="8.5" r="0.9" fill="#84cc16" />

      {/* Front Tray Slot */}
      <rect x="3.5" y="11.2" width="13" height="1.8" rx="0.3" fill="#2d2b40" />

      {/* Output Paper at Bottom */}
      <rect x="4.8" y="11" width="10.4" height="7.5" rx="0.5" fill="#ffffff" />
      <line x1="6.2" y1="13.5" x2="13.8" y2="13.5" stroke="#94a3b8" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="6.2" y1="15.2" x2="13.8" y2="15.2" stroke="#94a3b8" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="6.2" y1="16.9" x2="11.2" y2="16.9" stroke="#94a3b8" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

export default function UnderImagePrintButton() {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("open-print-modal"));
  };

  return (
    <div className="article-under-image-bar">
      <button
        type="button"
        onClick={handleClick}
        className="article-under-image-print-btn"
        title="প্রিন্ট নিউজ ও JPG সেভ করুন"
      >
        <RetroPrinterIcon className="w-[18px] h-[18px]" />
        <span>প্রিন্ট নিউজ</span>
      </button>
    </div>
  );
}
