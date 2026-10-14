'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdminAuthProvider } from './AdminAuthContext';
import { ToastProvider } from './ui/Toast';
import { CommandPalette } from './ui/CommandPalette';
import { AdminTopBar } from './navigation/AdminTopBar';
import { AdminSidebar } from './navigation/AdminSidebar';
import { AdminBottomBar } from './navigation/AdminBottomBar';
import { Drawer } from './ui/Drawer';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // If on login page, render raw without admin shell chrome
  if (pathname === '/admin/login') {
    return (
      <ToastProvider>
        <AdminAuthProvider>{children}</AdminAuthProvider>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <AdminAuthProvider>
        <div className="admin-shell-container w-full min-h-[100dvh] flex bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
          {/* Command Palette shortcut (Ctrl/Cmd+K) */}
          <CommandPalette />

          {/* Desktop & Tablet Sidebar (Hidden on Mobile < 1024px) */}
          <div className="hidden lg:flex shrink-0">
            <AdminSidebar
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
          </div>

          {/* Mobile Drawer (Shown when burger or 'More' tab is tapped) */}
          <Drawer
            isOpen={isMobileDrawerOpen}
            onClose={() => setIsMobileDrawerOpen(false)}
            title="Navigation Menu"
            side="left"
          >
            <AdminSidebar
              isCollapsed={false}
              onToggleCollapse={() => setIsMobileDrawerOpen(false)}
              onLinkClick={() => setIsMobileDrawerOpen(false)}
              className="border-none w-full !h-auto"
            />
          </Drawer>

          {/* Main View Area */}
          <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">
            {/* Sticky Topbar */}
            <AdminTopBar
              onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
              isSidebarCollapsed={isSidebarCollapsed}
            />

            {/* Scrollable Main Content Container */}
            <main
              id="admin-main-content"
              className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 bg-slate-50 dark:bg-[#090d16]"
            >
              <div className="max-w-7xl mx-auto w-full">{children}</div>
            </main>

            {/* Mobile Fixed Bottom Navigation Bar */}
            <AdminBottomBar onOpenMore={() => setIsMobileDrawerOpen(true)} />
          </div>
        </div>
      </AdminAuthProvider>
    </ToastProvider>
  );
}
