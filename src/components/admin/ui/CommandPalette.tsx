'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Folder, Users, Image as ImageIcon, Layout, Settings, ExternalLink, Plus } from 'lucide-react';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const navigationCommands = [
    { label: 'Create New Article', href: '/admin/posts/new', icon: <Plus className="w-4 h-4 text-emerald-500" /> },
    { label: 'All Articles', href: '/admin/posts', icon: <FileText className="w-4 h-4 text-sky-500" /> },
    { label: 'Categories & Sections', href: '/admin/categories', icon: <Folder className="w-4 h-4 text-amber-500" /> },
    { label: 'Media Library', href: '/admin/media', icon: <ImageIcon className="w-4 h-4 text-purple-500" /> },
    { label: 'Homepage Manager', href: '/admin/homepage', icon: <Layout className="w-4 h-4 text-teal-500" /> },
    { label: 'System Settings', href: '/admin/settings', icon: <Settings className="w-4 h-4 text-slate-500" /> },
    { label: 'Users & Roles', href: '/admin/users', icon: <Users className="w-4 h-4 text-indigo-500" /> },
    { label: 'View Public Website', href: '/', icon: <ExternalLink className="w-4 h-4 text-blue-500" /> },
  ];

  const filtered = navigationCommands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  function execute(href: string) {
    setIsOpen(false);
    router.push(href);
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 p-4 overflow-hidden"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-backdrop"
        onClick={() => setIsOpen(false)}
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or jump to page..."
            className="w-full bg-transparent text-[16px] sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-mono font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 flex flex-col gap-1">
          {filtered.length > 0 ? (
            filtered.map((cmd) => (
              <button
                key={cmd.href}
                type="button"
                onClick={() => execute(cmd.href)}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl text-left flex items-center justify-between text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {cmd.icon}
                  <span className="font-medium">{cmd.label}</span>
                </div>
                <span className="text-xs text-slate-400">Go</span>
              </button>
            ))
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">No matching commands</div>
          )}
        </div>
      </div>
    </div>
  );
}
