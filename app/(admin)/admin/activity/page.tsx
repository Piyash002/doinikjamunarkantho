'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
  Activity,
  Filter,
  User,
  Clock,
  Globe,
  FileText,
  Layers,
  Settings,
  Shield,
  Tag,
  Image as ImageIcon,
  LogIn,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Edit3,
  PlusCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PageHeader } from '@/src/components/admin/ui/PageHeader';
import { Button } from '@/src/components/admin/ui/Button';
import { Select } from '@/src/components/admin/ui/Select';
import { Input } from '@/src/components/admin/ui/Input';
import { Badge } from '@/src/components/admin/ui/Badge';
import { Pagination } from '@/src/components/admin/ui/Pagination';
import { TableSkeleton } from '@/src/components/admin/ui/Skeleton';
import { Modal } from '@/src/components/admin/ui/Modal';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AuditLogItem {
  _id: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  metadata?: any;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export default function ActivityLogPage() {
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: '25',
    ...(actionFilter ? { action: actionFilter } : {}),
    ...(entityFilter ? { entity: entityFilter } : {}),
    ...(userQuery ? { user: userQuery } : {}),
  });

  const { data, isLoading } = useSWR(`/api/admin/activity?${queryParams.toString()}`, fetcher);

  const logs: AuditLogItem[] = data?.success && Array.isArray(data.data) ? data.data : [];
  const meta = data?.meta || { total: 0, totalPages: 1, page: 1, limit: 25 };

  function getActionBadge(action: string) {
    switch (action) {
      case 'create':
        return <Badge variant="success">Created</Badge>;
      case 'publish':
        return <Badge variant="primary">Published</Badge>;
      case 'update':
      case 'reorder':
      case 'settings_update':
        return <Badge variant="info">Updated</Badge>;
      case 'unpublish':
        return <Badge variant="warning">Unpublished</Badge>;
      case 'delete':
        return <Badge variant="danger">Deleted</Badge>;
      case 'restore':
        return <Badge variant="neutral">Restored</Badge>;
      case 'login':
        return <Badge variant="primary">Login</Badge>;
      case 'logout':
        return <Badge variant="neutral">Logout</Badge>;
      default:
        return <Badge variant="neutral">{action}</Badge>;
    }
  }

  function getEntityIcon(entity: string) {
    switch (entity) {
      case 'post':
        return <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'category':
        return <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'tag':
        return <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'media':
        return <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'user':
        return <User className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'settings':
      case 'ad':
      case 'homepage':
        return <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
      case 'auth':
        return <LogIn className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Activity Log"
        subtitle="Chronological audit trail of all editorial operations, system adjustments, and logins"
      />

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search by username..."
            value={userQuery}
            onChange={(e) => {
              setUserQuery(e.target.value);
              setPage(1);
            }}
          />

          <Select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Actions' },
              { value: 'create', label: 'Create' },
              { value: 'update', label: 'Update' },
              { value: 'publish', label: 'Publish' },
              { value: 'unpublish', label: 'Unpublish' },
              { value: 'delete', label: 'Delete' },
              { value: 'restore', label: 'Restore' },
              { value: 'login', label: 'Login' },
              { value: 'reorder', label: 'Reorder' },
              { value: 'settings_update', label: 'Settings Change' },
            ]}
          />

          <Select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Entities' },
              { value: 'post', label: 'Post / Article' },
              { value: 'category', label: 'Category' },
              { value: 'tag', label: 'Tag' },
              { value: 'author', label: 'Author' },
              { value: 'media', label: 'Media Asset' },
              { value: 'user', label: 'User Account' },
              { value: 'homepage', label: 'Homepage' },
              { value: 'settings', label: 'Settings' },
              { value: 'ad', label: 'Advertisement' },
              { value: 'auth', label: 'Authentication' },
            ]}
          />
        </div>

        {(actionFilter || entityFilter || userQuery) && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500">
              Filtering results {meta.total ? `(${meta.total} events found)` : ''}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActionFilter('');
                setEntityFilter('');
                setUserQuery('');
                setPage(1);
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>

      {/* Log Feed */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : logs.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <Activity className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No activity records</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters to find logged events.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((item) => (
            <div
              key={item._id}
              onClick={() => setSelectedLog(item)}
              className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 shadow-xs hover:border-[#1b7d95]/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 shrink-0 mt-0.5">
                  {getEntityIcon(item.entity)}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {item.userName}
                    </span>
                    <span className="text-xs text-slate-400">({item.userRole})</span>
                    {getActionBadge(item.action)}
                    <span className="text-xs font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                      {item.entity}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-xl">
                    {item.details || `Performed ${item.action} on ${item.entity}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1.5 text-xs text-slate-400 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                {item.ip && (
                  <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                    <Globe className="w-3 h-3" />
                    <span>{item.ip}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {meta.totalPages > 1 && (
            <div className="pt-4 flex justify-center">
              <Pagination
                currentPage={meta.page}
                totalPages={meta.totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* Event Details Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Details"
        size="md"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block mb-0.5">User</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedLog.userName} ({selectedLog.userRole})
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block mb-0.5">Action & Entity</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {selectedLog.action} • {selectedLog.entity}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block mb-0.5">Timestamp</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block mb-0.5">Client IP</span>
                <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                  {selectedLog.ip || 'Unknown'}
                </span>
              </div>
            </div>

            {selectedLog.details && (
              <div>
                <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Description</h4>
                <p className="text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                  {selectedLog.details}
                </p>
              </div>
            )}

            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Metadata Payload</h4>
                <pre className="text-[11px] font-mono bg-slate-900 text-slate-200 p-3.5 rounded-xl overflow-x-auto max-h-60">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
