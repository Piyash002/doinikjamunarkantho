'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import {
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Edit,
  Trash2,
  Lock,
  Mail,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { PageHeader } from '@/src/components/admin/ui/PageHeader';
import { Button } from '@/src/components/admin/ui/Button';
import { Input } from '@/src/components/admin/ui/Input';
import { Select } from '@/src/components/admin/ui/Select';
import { Modal } from '@/src/components/admin/ui/Modal';
import { FormField } from '@/src/components/admin/ui/FormField';
import { Badge } from '@/src/components/admin/ui/Badge';
import { Switch } from '@/src/components/admin/ui/Switch';
import { ConfirmDialog } from '@/src/components/admin/ui/ConfirmDialog';
import { ImageUploader, ImageValue } from '@/src/components/admin/ui/ImageUploader';
import { DataTable, Column } from '@/src/components/admin/ui/DataTable';
import { TableSkeleton } from '@/src/components/admin/ui/Skeleton';
import { useToast } from '@/src/components/admin/ui/Toast';
import { useAdminAuth } from '@/src/components/admin/AdminAuthContext';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AdminUserData {
  _id: string;
  username: string;
  name?: string;
  email?: string;
  role: 'admin' | 'editor' | 'reporter';
  avatar?: { url: string; alt?: string };
  isActive?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export default function UsersPage() {
  const { user: currentAuthUser } = useAdminAuth();
  const { data, mutate, isLoading } = useSWR('/api/admin/users', fetcher);
  const { success: toastSuccess, error: toastError } = useToast();

  const users: AdminUserData[] = data?.success && Array.isArray(data.data) ? data.data : [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'editor' | 'reporter'>('editor');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<ImageValue | null>(null);
  const [isActive, setIsActive] = useState(true);

  if (currentAuthUser && currentAuthUser.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Access Restricted</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Only administrators have permission to manage system accounts and assign user roles.
        </p>
      </div>
    );
  }

  function openCreateModal() {
    setEditingUser(null);
    setUsername('');
    setName('');
    setEmail('');
    setRole('editor');
    setPassword('');
    setAvatar(null);
    setIsActive(true);
    setIsModalOpen(true);
  }

  function openEditModal(target: AdminUserData) {
    setEditingUser(target);
    setUsername(target.username);
    setName(target.name || '');
    setEmail(target.email || '');
    setRole(target.role);
    setPassword(''); // leave blank unless updating
    setAvatar(target.avatar || null);
    setIsActive(target.isActive !== false);
    setIsModalOpen(true);
  }

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser && !username.trim()) {
      toastError('Username is required.');
      return;
    }
    if (!editingUser && (!password || password.length < 6)) {
      toastError('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsSaving(true);
      const payload: Record<string, any> = {
        name: name.trim(),
        email: email.trim(),
        role,
        avatar,
        isActive,
      };

      if (!editingUser) {
        payload.username = username.trim().toLowerCase();
        payload.password = password;
      } else if (password) {
        payload.password = password;
      }

      const url = editingUser ? `/api/admin/users/${editingUser._id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to save user account.');
      }

      setIsModalOpen(false);
      mutate();
      toastSuccess(editingUser ? 'User updated successfully!' : 'User created successfully!');
    } catch (err: any) {
      toastError(err.message || 'Operation failed.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteUser() {
    if (!deleteConfirmId) return;
    try {
      const res = await fetch(`/api/admin/users/${deleteConfirmId}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to delete user.');
      }
      setDeleteConfirmId(null);
      mutate();
      toastSuccess('User removed permanently.');
    } catch (err: any) {
      toastError(err.message || 'Failed to delete user.');
    }
  }

  const roleBadgeVariants: Record<string, { variant: 'primary' | 'warning' | 'info'; label: string; icon: any }> = {
    admin: { variant: 'primary', label: 'Admin', icon: ShieldCheck },
    editor: { variant: 'info', label: 'Editor', icon: Shield },
    reporter: { variant: 'warning', label: 'Reporter', icon: UserIcon },
  };

  const columns: Column<AdminUserData>[] = [
    {
      key: 'user',
      header: 'User',
      render: (u) => {
        const badgeInfo = roleBadgeVariants[u.role] || roleBadgeVariants.reporter;
        const RoleIcon = badgeInfo.icon;
        return (
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
              {u.avatar?.url ? (
                <Image src={u.avatar.url} alt={u.name || u.username} fill className="object-cover" />
              ) : (
                <span className="text-sm font-bold text-[#0a2b3a] dark:text-cyan-400">
                  {(u.name || u.username).substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                {u.name || u.username}
                {currentAuthUser?.id === u._id && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                    You
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>@{u.username}</span>
                {u.email && <span>• {u.email}</span>}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => {
        const badge = roleBadgeVariants[u.role] || roleBadgeVariants.reporter;
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
            u.isActive !== false
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
          }`}
        >
          {u.isActive !== false ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {u.isActive !== false ? 'Active' : 'Disabled'}
        </span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Active',
      render: (u) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(u)} title="Edit user">
            <Edit className="w-4 h-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200" />
          </Button>
          {currentAuthUser?.id !== u._id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmId(u._id)}
              title="Delete user"
            >
              <Trash2 className="w-4 h-4 text-rose-500 hover:text-rose-700" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Users & Roles"
        subtitle="Manage editorial staff, assign roles, and define publishing permissions"
        actions={
          <Button onClick={openCreateModal} className="flex items-center gap-1.5">
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </Button>
        }
      />

      {/* Role permission info banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-[#0a2b3a] dark:text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Administrator</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Full control over the portal: site settings, users, ads, homepage manager, and all posts.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Shield className="w-4 h-4" />
            </span>
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Editor</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Full content management: create, edit, and publish any news post, manage categories, tags, and media.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <UserIcon className="w-4 h-4" />
            </span>
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Reporter</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Draft contributor: can create and edit their own articles in draft mode only. Cannot publish live.
          </p>
        </div>
      </div>

      {/* Users DataTable / Cards */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        <DataTable
          columns={columns}
          data={users}
          keyField="_id"
          renderMobileCard={(u) => {
            const badge = roleBadgeVariants[u.role] || roleBadgeVariants.reporter;
            return (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                      {u.avatar?.url ? (
                        <Image src={u.avatar.url} alt={u.name || u.username} fill className="object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-[#0a2b3a] dark:text-cyan-400">
                          {(u.name || u.username).substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        {u.name || u.username}
                        {currentAuthUser?.id === u._id && (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">@{u.username}</div>
                    </div>
                  </div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>

                {u.email && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{u.email}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 font-medium ${
                      u.isActive !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                    }`}
                  >
                    {u.isActive !== false ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {u.isActive !== false ? 'Active' : 'Disabled'}
                  </span>

                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(u)}>
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                    {currentAuthUser?.id !== u._id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(u._id)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          }}
        />
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Edit User: @${editingUser.username}` : 'Add New User'}
        size="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div className="flex justify-center mb-2">
            <ImageUploader
              value={avatar}
              onChange={setAvatar}
              onRemove={() => setAvatar(null)}
              label="User Avatar"
              folder="users"
              aspectRatio="square"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField label="Username" required={!editingUser}>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. editor_rahim"
                disabled={!!editingUser}
                required={!editingUser}
              />
            </FormField>

            <FormField label="Full Name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Abdur Rahim"
              />
            </FormField>
          </div>

          <FormField label="Email Address">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@doinikjamunarkantho.com"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField label="Role" required>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                options={[
                  { value: 'admin', label: 'Admin (Full Access)' },
                  { value: 'editor', label: 'Editor (Publish Any Post)' },
                  { value: 'reporter', label: 'Reporter (Drafts Only)' },
                ]}
              />
            </FormField>

            <FormField
              label={editingUser ? 'New Password (Optional)' : 'Password'}
              required={!editingUser}
              hint={editingUser ? 'Leave blank to retain existing password' : 'Min 6 characters'}
            >
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editingUser ? '••••••••' : 'Enter password'}
                required={!editingUser}
              />
            </FormField>
          </div>

          <div className="pt-2">
            <Switch
              checked={isActive}
              onChange={setIsActive}
              label="Active Account"
              description="Inactive accounts cannot log in to the admin panel."
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteUser}
        title="Delete User Account"
        message="Are you sure you want to delete this user? All their logged actions will be retained in the activity audit trail, but their login credentials will be permanently erased."
        confirmText="Delete Account"
        variant="danger"
      />
    </div>
  );
}
