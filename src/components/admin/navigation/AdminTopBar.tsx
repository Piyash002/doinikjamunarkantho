'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  Menu,
  Search,
  Moon,
  Sun,
  ExternalLink,
  Bell,
  Plus,
  User,
  Key,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAdminAuth } from '../AdminAuthContext';
import { Dropdown } from '../ui/Dropdown';
import { Button } from '../ui/Button';

export interface AdminTopBarProps {
  onToggleSidebar?: () => void;
  onOpenMobileMenu: () => void;
  isSidebarCollapsed?: boolean;
}

export function AdminTopBar({
  onToggleSidebar,
  onOpenMobileMenu,
  isSidebarCollapsed = false,
}: AdminTopBarProps) {
  const { user, logout } = useAdminAuth();
  const [isDark, setIsDark] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check initial dark mode from document or storage
    const isDarkMode =
      document.documentElement.classList.contains('dark') ||
      document.documentElement.getAttribute('data-theme') === 'dark' ||
      localStorage.getItem('admin_theme') === 'dark';
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  function toggleTheme() {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('admin_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('admin_theme', 'light');
    }
  }

  // Get active section title from pathname
  function getPageTitle(path: string): string {
    if (path === '/admin') return 'Editorial Dashboard';
    if (path.startsWith('/admin/posts/new')) return 'New Article';
    if (path.includes('/edit')) return 'Edit Article';
    if (path.startsWith('/admin/posts')) return 'Articles & News';
    if (path.startsWith('/admin/categories')) return 'Categories & Sections';
    if (path.startsWith('/admin/tags')) return 'Tags & Topics';
    if (path.startsWith('/admin/authors')) return 'Authors & Team';
    if (path.startsWith('/admin/media')) return 'Media Library';
    if (path.startsWith('/admin/homepage')) return 'Homepage Manager';
    if (path.startsWith('/admin/ads')) return 'Advertisements';
    if (path.startsWith('/admin/trending')) return 'Trending & Breaking';
    if (path.startsWith('/admin/pages')) return 'Static Pages';
    if (path.startsWith('/admin/settings')) return 'Site Settings';
    if (path.startsWith('/admin/users')) return 'Users & Roles';
    if (path.startsWith('/admin/activity')) return 'Activity Log';
    if (path.startsWith('/admin/profile')) return 'My Profile';
    return 'Newsroom';
  }

  const userMenuItems = [
    {
      label: 'My Profile',
      icon: <User className="w-4 h-4" />,
      onClick: () => router.push('/admin/profile'),
    },
    {
      label: 'Change Password',
      icon: <Key className="w-4 h-4" />,
      onClick: () => router.push('/admin/profile?tab=password'),
    },
    {
      label: 'Sign Out',
      icon: <LogOut className="w-4 h-4" />,
      danger: true,
      onClick: logout,
    },
  ];

  return (
    <header className="h-16 shrink-0 z-30 sticky top-0 flex items-center justify-between px-4 sm:px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Left side: Hamburger (mobile/tablet) + Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden touch-target p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider font-bold text-[#1b7d95] hidden sm:block">
            Jamunar Kantho CMS
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-none">
            {getPageTitle(pathname)}
          </h2>
        </div>
      </div>

      {/* Right side: Global Search, New Post, View Site, Dark Mode, User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search trigger (desktop & tablet) */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true })
            );
          }}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-400 text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          aria-label="Search or jump to page"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Quick search...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-xs">
            ⌘K
          </kbd>
        </button>

        {/* Quick New Post Button (Mobile & Desktop) */}
        <Link
          href="/admin/posts/new"
          className="touch-target inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a2b3a] dark:bg-[#1b7d95] text-white text-xs sm:text-sm font-semibold hover:bg-[#123e54] dark:hover:bg-[#2092ad] active:scale-95 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Post</span>
        </Link>

        {/* View Public Website Link (Desktop) */}
        <Link
          href="/"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Open live public website in new tab"
        >
          <span>View Site</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="touch-target p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Menu Dropdown */}
        <Dropdown
          align="right"
          trigger={
            <button
              type="button"
              className="touch-target flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="User account menu"
            >
              {user?.avatar ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                  <Image src={user.avatar} alt={user.name || 'User'} fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#0a2b3a] dark:bg-[#1b7d95] text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  {user?.name?.[0] || user?.username?.[0] || 'A'}
                </div>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>
          }
          items={userMenuItems}
        />
      </div>
    </header>
  );
}
