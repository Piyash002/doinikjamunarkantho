import mongoose from 'mongoose';
import { connectToDatabase } from '@/src/lib/db';
import AuditLog from '@/src/models/AuditLog';

export type AuditLogInput = {
  userId?: string | null;
  userName?: string;
  userRole?: string;
  action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish' | 'restore' | 'login' | 'logout' | 'reorder' | 'settings_update' | 'bulk_action';
  entity: 'post' | 'category' | 'tag' | 'author' | 'media' | 'user' | 'settings' | 'ad' | 'homepage' | 'page' | 'auth';
  entityId?: string;
  details?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
};

export async function logActivity(data: AuditLogInput) {
  try {
    await connectToDatabase();
    await AuditLog.create({
      userId: data.userId && mongoose.isValidObjectId(data.userId) ? data.userId : null,
      userName: data.userName || 'System',
      userRole: data.userRole || 'admin',
      action: data.action,
      entity: data.entity,
      entityId: data.entityId || '',
      details: data.details || '',
      metadata: data.metadata || {},
      ip: data.ip || '',
      userAgent: data.userAgent || '',
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

export async function getAuditLogs(params: {
  action?: string;
  entity?: string;
  user?: string;
  page?: number;
  limit?: number;
}) {
  await connectToDatabase();
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 25));

  const filter: Record<string, unknown> = {};
  if (params.action && params.action !== 'all') filter.action = params.action;
  if (params.entity && params.entity !== 'all') filter.entity = params.entity;
  if (params.user && params.user !== 'all') filter.userName = { $regex: params.user, $options: 'i' };

  const total = await AuditLog.countDocuments(filter);
  const logs = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
}
