import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String },
  module: { type: String },
  description: { type: String }
}, { timestamps: true });

export default mongoose.model('AuditLog', auditLogSchema);
