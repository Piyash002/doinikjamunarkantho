'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Tag,
  Users2,
  Image as ImageIcon,
  LayoutTemplate,
  Megaphone,
  TrendingUp,
  FileCode,
  Settings,
  ShieldCheck,
  History,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { useAdminAuth } from '../AdminAuthContext';

export interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
  onLinkClick?: () => void;
}

export function AdminSidebar({
  isCollapsed,
  onToggleCollapse,
  className = '',
  onLinkClick,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAdminAuth();

  const role = user?.role || 'admin';

  // Define sidebar navigation groups with role requirements
  const navigationGroups = [
    {
      group: 'Overview',
      items: [
        {
          label: 'Dashboard',
          href: '/admin',
          icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
          exact: true,
        },
      ],
    },
    {
      group: 'Content',
      items: [
        {
          label: 'Articles',
          href: '/admin/posts',
          icon: <FileText className="w-5 h-5 shrink-0" />,
        },
        {
          label: 'Categories',
          href: '/admin/categories',
          icon: <FolderTree className="w-5 h-5 shrink-0" />,
          allowedRoles: ['admin', 'editor'],
        },
        {
          label: 'Tags & Topics',
          href: '/admin/tags',
          icon: <Tag className="w-5 h-5 shrink-0" />,
          allowedRoles: ['admin', 'editor'],
        },
        {
          label: 'Authors',
          href: '/admin/authors',
          icon: <Users2 className="w-5 h-5 shrink-0" />,
          allowedRoles: ['admin', 'editor'],
        },
        {
          label: 'Media Library',
          href: '/admin/media',
          icon: <ImageIcon className="w-5 h-5 shrink-0" />,
        },
      ],
    },
    {
      group: 'Site',
      items: [
        {
          label: 'Homepage Manager',
          href: '/admin/homepage',
          icon: <LayoutTemplate className="w-5 h-5 shrink-0" />,
          allowedRoles: ['admin'],
        },
        {
          label: 'Advertisements',
          href: '/admin/ads',
          icon: <Megaphone className="w-5 h-5 shrink-0" />,
          allowedRoles: ['admin'],
        },
        {
          label: 'Trending & Breaking',
          href: '/admin/trending',
          icon: <TrendingUp className="w-5 h-5 shrink-0" />,
          allowedRoles: ['admin', 'editor'],
        },
        {
          label: 'Static Pages',
          href: '/admin/pages',
          icon: <FileCode className="w-5 h-5 shrink-0" />,
          allowedRoles: ['admin'],
        },
        {
          label: 'Settings',
          href: '/admin/settings',
          icon: <Settings className="w-5 h-5 shrink-0" />,
          allowedRoles: ['admin'],
        },
      ],
    },
    {
      group: 'System',
      items: [
        {
          label: 'Users & Roles',
          href: '/admin/users',
          icon: <ShieldCheck className="w-5 h-5 shrink-0" />,
          allowedRoles: ['admin'],
        },
        {
          label: 'Activity Log',
          href: '/admin/activity',
          icon: <History className="w-5 h-5 shrink-0" />,
          allowedRoles: ['admin'],
        },
      ],
    },
  ];

  function isActive(href: string, exact = false) {
    if (exact || href === '/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={`h-[100dvh] flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out select-none ${
        isCollapsed ? 'w-[72px]' : 'w-[260px]'
      } ${className}`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <Link
          href="/admin"
          onClick={onLinkClick}
          className="flex items-center gap-2.5 overflow-hidden"
        >
          <div className="w-9 h-9 rounded-xl bg-[#0a2b3a] dark:bg-[#1b7d95] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
            য
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tracking-tight leading-tight truncate">
                যমুনা কণ্ঠ
              </span>
              <span className="text-[10px] uppercase font-bold text-[#1b7d95] tracking-wider">
                Newsroom
              </span>
            </div>
          )}
        </Link>

        {/* Desktop collapse toggle button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation list */}
      <nav aria-label="Main sidebar navigation" className="flex-1 overflow-y-auto p-3 flex flex-col gap-6">
        {navigationGroups.map((group) => {
          // Filter items based on user role
          const visibleItems = group.items.filter(
            (item) => !item.allowedRoles || item.allowedRoles.includes(role)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.group} className="flex flex-col gap-1">
              {!isCollapsed && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3 mb-1">
                  {group.group}
                </span>
              )}
              {visibleItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onLinkClick}
                    className={`min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? 'bg-[#1b7d95]/10 text-[#1b7d95] dark:bg-[#1b7d95]/30 dark:text-sky-300 font-bold shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User profile card & logout */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 shrink-0 flex flex-col gap-1">
        <Link
          href="/"
          target="_blank"
          className={`min-h-[40px] flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="View live website"
        >
          <ExternalLink className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" />
          {!isCollapsed && <span>View Website</span>}
        </Link>

        <div className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-[#0a2b3a] dark:bg-[#1b7d95] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
            {user?.name?.[0] || user?.username?.[0] || 'A'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {user?.name || user?.username}
              </p>
              <p className="text-[10px] text-[#1b7d95] dark:text-sky-400 capitalize font-semibold">{user?.role}</p>
            </div>
          )}
          {!isCollapsed && (
            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
