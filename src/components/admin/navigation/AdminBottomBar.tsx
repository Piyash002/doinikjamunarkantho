'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Plus, Image as ImageIcon, Menu } from 'lucide-react';
import { useAdminSettings } from '../AdminSettingsContext';

export interface AdminBottomBarProps {
  onOpenMore: () => void;
}

export function AdminBottomBar({ onOpenMore }: AdminBottomBarProps) {
  const pathname = usePathname();
  const { adminPrimaryColor } = useAdminSettings();
  const [isKeyboardOpen, setIsKeyboardOpen] = React.useState(false);

  // Hide sticky bottom tab bar when on-screen keyboard is open using visualViewport API
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const handleResize = () => {
      const diff = window.innerHeight - vv.height;
      setIsKeyboardOpen(diff > 140);
    };
    vv.addEventListener('resize', handleResize);
    return () => vv.removeEventListener('resize', handleResize);
  }, []);

  if (isKeyboardOpen) return null;

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  const tabItems = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: 'Posts',
      href: '/admin/posts',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      label: '+ New',
      href: '/admin/posts/new',
      isCreate: true,
      icon: <Plus className="w-6 h-6 stroke-[2.5]" />,
    },
    {
      label: 'Media',
      href: '/admin/media',
      icon: <ImageIcon className="w-5 h-5" />,
    },
    {
      label: 'More',
      onClick: onOpenMore,
      icon: <Menu className="w-5 h-5" />,
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="flex items-center justify-around h-16 px-1">
        {tabItems.map((item, idx) => {
          if (item.isCreate) {
            return (
              <Link
                key={idx}
                href={item.href!}
                className="flex items-center justify-center -mt-5 w-12 h-12 rounded-full bg-[#0a2b3a] dark:bg-[#1b7d95] text-white shadow-lg shadow-teal-900/20 active:scale-95 transition-transform"
                style={{ backgroundColor: adminPrimaryColor || undefined }}
                aria-label="Create new article"
              >
                {item.icon}
              </Link>
            );
          }

          if (item.onClick) {
            return (
              <button
                key={idx}
                type="button"
                onClick={item.onClick}
                className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 text-slate-500 dark:text-slate-400 active:scale-95 transition-all"
                aria-label="Open more menu"
              >
                {item.icon}
                <span className="text-[10px] font-semibold mt-1">{item.label}</span>
              </button>
            );
          }

          const active = isActive(item.href!);
          return (
            <Link
              key={idx}
              href={item.href!}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 transition-all ${
                active
                  ? 'text-[#1b7d95] dark:text-sky-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-semibold mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
