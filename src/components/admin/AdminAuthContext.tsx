'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';

export type AdminUser = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'reporter';
  avatar?: string;
  permissions: {
    canPublish: boolean;
    canManageUsers: boolean;
    canManageSettings: boolean;
    canManageAds: boolean;
    canManageHomepage: boolean;
    canManageContent: boolean;
  };
};

type AdminAuthContextType = {
  user: AdminUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  mutate: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data, mutate, isLoading } = useSWR('/api/admin/auth/me', fetcher, {
    revalidateOnFocus: true,
  });

  const user = data?.success ? (data.data as AdminUser) : null;

  async function logout() {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.replace('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  return (
    <AdminAuthContext.Provider value={{ user, isLoading, logout, mutate }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
