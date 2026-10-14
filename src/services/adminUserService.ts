import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/src/lib/db';
import AdminUser from '@/src/models/AdminUser';
import { logActivity } from './adminAuditService';
import type { AdminUserSession } from './adminPostService';

export async function getAdminUsers(session: AdminUserSession) {
  await connectToDatabase();
  if (session.role !== 'admin') {
    throw new Error('Only administrators can view team members.');
  }

  const users = await AdminUser.find({})
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .lean();

  return users;
}

export async function createAdminUser(data: any, session: AdminUserSession) {
  await connectToDatabase();
  if (session.role !== 'admin') {
    throw new Error('Only administrators can create team members.');
  }

  const existing = await AdminUser.findOne({ username: data.username.trim() });
  if (existing) {
    throw new Error('Username is already taken.');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await AdminUser.create({
    username: data.username.trim(),
    name: data.name || '',
    email: data.email || '',
    role: data.role || 'editor',
    avatar: data.avatar || { url: '', publicId: '' },
    isActive: data.isActive !== false,
    passwordHash,
  });

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'create',
    entity: 'user',
    entityId: String(user._id),
    details: `Created user account for "${user.username}" (${user.role})`,
  });

  return {
    _id: String(user._id),
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    isActive: user.isActive,
  };
}

export async function updateAdminUser(id: string, data: any, session: AdminUserSession) {
  await connectToDatabase();
  if (session.role !== 'admin') {
    throw new Error('Only administrators can update team members.');
  }

  const user = await AdminUser.findById(id);
  if (!user) throw new Error('User not found.');

  if (data.password) {
    user.passwordHash = await bcrypt.hash(data.password, 10);
  }

  if (data.name !== undefined) user.name = data.name;
  if (data.email !== undefined) user.email = data.email;
  if (data.role !== undefined) user.role = data.role;
  if (data.isActive !== undefined) user.isActive = data.isActive;
  if (data.avatar !== undefined) user.avatar = data.avatar;

  await user.save();

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'update',
    entity: 'user',
    entityId: id,
    details: `Updated user account for "${user.username}"`,
  });

  return {
    _id: String(user._id),
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    isActive: user.isActive,
  };
}

export async function deleteAdminUser(id: string, session: AdminUserSession) {
  await connectToDatabase();
  if (session.role !== 'admin') {
    throw new Error('Only administrators can delete team members.');
  }

  if (String(session.id) === String(id)) {
    throw new Error('You cannot delete your own admin account.');
  }

  const user = await AdminUser.findByIdAndDelete(id);
  if (!user) throw new Error('User not found.');

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'delete',
    entity: 'user',
    entityId: id,
    details: `Deleted user account "${user.username}"`,
  });

  return { success: true };
}

export async function getAdminUserProfile(session: AdminUserSession) {
  await connectToDatabase();
  const user = await AdminUser.findById(session.id).select('-passwordHash').lean();
  if (!user) throw new Error('User not found.');
  return user;
}

export async function updateAdminUserProfile(
  data: {
    name?: string;
    email?: string;
    avatar?: { url: string; publicId?: string };
    currentPassword?: string;
    newPassword?: string;
  },
  session: AdminUserSession
) {
  await connectToDatabase();
  const user = await AdminUser.findById(session.id);
  if (!user) throw new Error('User not found.');

  if (data.newPassword) {
    if (!data.currentPassword) {
      throw new Error('Current password is required to change password.');
    }
    const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error('Current password does not match.');
    }
    user.passwordHash = await bcrypt.hash(data.newPassword, 10);
  }

  if (data.name !== undefined) user.name = data.name;
  if (data.email !== undefined) user.email = data.email;
  if (data.avatar !== undefined) user.avatar = data.avatar;

  await user.save();

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'update',
    entity: 'user',
    entityId: String(user._id),
    details: 'Updated personal profile and credentials',
  });

  return {
    _id: String(user._id),
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  };
}
