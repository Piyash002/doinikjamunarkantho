'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import {
  User,
  Mail,
  Shield,
  KeyRound,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/src/components/admin/ui/PageHeader';
import { Button } from '@/src/components/admin/ui/Button';
import { Input } from '@/src/components/admin/ui/Input';
import { FormField } from '@/src/components/admin/ui/FormField';
import { Badge } from '@/src/components/admin/ui/Badge';
import { ImageUploader, ImageValue } from '@/src/components/admin/ui/ImageUploader';
import { useToast } from '@/src/components/admin/ui/Toast';
import { useAdminAuth } from '@/src/components/admin/AdminAuthContext';
import { Skeleton } from '@/src/components/admin/ui/Skeleton';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProfilePage() {
  const { user: authUser, mutate: refreshAuth } = useAdminAuth();
  const { data, mutate, isLoading } = useSWR('/api/admin/profile', fetcher);
  const { success: toastSuccess, error: toastError } = useToast();

  const profile = data?.success ? data.data : null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<ImageValue | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setAvatar(profile.avatar || null);
    }
  }, [profile]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword) {
      if (newPassword.length < 6) {
        toastError('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        toastError('New passwords do not match.');
        return;
      }
      if (!currentPassword) {
        toastError('Please enter your current password to set a new one.');
        return;
      }
    }

    try {
      setIsSaving(true);
      const payload: Record<string, any> = {
        name: name.trim(),
        email: email.trim(),
        avatar,
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to update profile.');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      mutate();
      refreshAuth();
      toastSuccess('Profile updated successfully!');
    } catch (err: any) {
      toastError(err.message || 'Error updating profile.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const roleLabel =
    profile?.role === 'admin'
      ? 'Administrator'
      : profile?.role === 'editor'
      ? 'Editor'
      : 'Reporter';

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Account Profile"
        subtitle="Manage your personal details, profile picture, and access password"
      />

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Details Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-5 border-b border-slate-100 dark:border-slate-800">
            <ImageUploader
              value={avatar}
              onChange={setAvatar}
              onRemove={() => setAvatar(null)}
              label="Avatar Image"
              folder="users"
              aspectRatio="square"
            />

            <div className="text-center sm:text-left space-y-1.5 flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                  {name || profile?.username || 'User Profile'}
                </h3>
                <Badge variant={profile?.role === 'admin' ? 'primary' : 'info'}>
                  {roleLabel}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">@{profile?.username}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Avatar is displayed across post author bylines and the admin navigation bars.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </FormField>

            <FormField label="Username" hint="Username cannot be altered">
              <Input value={profile?.username || ''} disabled className="bg-slate-50 dark:bg-slate-800" />
            </FormField>
          </div>

          <FormField label="Email Address">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="editor@doinikjamunarkantho.com"
            />
          </FormField>
        </div>

        {/* Change Password Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-[#0a2b3a] dark:text-cyan-400">
              <KeyRound className="w-4 h-4" />
            </span>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              Change Password
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Leave blank if you do not want to change your current password.
          </p>

          <FormField label="Current Password">
            <div className="relative">
              <Input
                type={showCurrentPass ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                tabIndex={-1}
              >
                {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="New Password" hint="Minimum 6 characters">
              <div className="relative">
                <Input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New secure password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  tabIndex={-1}
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>

            <FormField label="Confirm New Password">
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </FormField>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="submit" isLoading={isSaving} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            <span>Save Profile</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
