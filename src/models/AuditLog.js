import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
    userName: { type: String, default: 'System', trim: true },
    userRole: { type: String, default: 'admin' },
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'publish', 'unpublish', 'restore', 'login', 'logout', 'reorder', 'settings_update', 'bulk_action'],
      required: true,
    },
    entity: {
      type: String,
      enum: ['post', 'category', 'tag', 'author', 'media', 'user', 'settings', 'ad', 'homepage', 'page', 'auth'],
      required: true,
    },
    entityId: { type: String, default: '' },
    details: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entity: 1, action: 1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
