const mongoose = require('mongoose');
const auditPlugin = require('../../../models/plugins/auditPlugin');

const checklistItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    isDone: { type: Boolean, default: false },
  },
  { _id: true, timestamps: false }
);

const commentSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true, timestamps: false }
);

const timeLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    minutes: { type: Number, required: true, min: 1 },
    note: { type: String, default: '' },
    loggedAt: { type: Date, default: Date.now },
  },
  { _id: true, timestamps: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
      index: true,
    },
    reminderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reminder',
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'in_review', 'done', 'blocked'],
      default: 'todo',
      index: true,
    },
    // CA filing workflow column on the Kanban board. `status` stays the
    // coarse progress field used by dashboards; the service keeps the two in
    // sync whenever the card moves.
    stage: {
      type: String,
      enum: [
        'document_collection', 'verification', 'preparation',
        'review', 'partner_approval', 'filed', 'completed',
      ],
      default: 'document_collection',
      index: true,
    },
    dueDate: { type: Date, default: null, index: true },
    checklist: [checklistItemSchema],
    comments: [commentSchema],
    timeLogs: [timeLogSchema],
    documentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  },
  { timestamps: true }
);

taskSchema.plugin(auditPlugin);
taskSchema.index({ firmId: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
