const { Router } = require('express');

const authRoutes = require('../features/auth/routes/auth.routes');
const userRoutes = require('../features/users/routes/user.routes');
const dashboardRoutes = require('../features/dashboard/routes/dashboard.routes');
const clientRoutes = require('../features/clients/routes/client.routes');
const leadRoutes = require('../features/crm/routes/lead.routes');
const khataRoutes = require('../features/khatabook/routes/ledger.routes');
const reminderRoutes = require('../features/reminders/routes/reminder.routes');
const notificationRoutes = require('../features/reminders/routes/notification.routes');
const taskRoutes = require('../features/tasks/routes/task.routes');
const taskTemplateRoutes = require('../features/taskTemplates/routes/taskTemplate.routes');
const invoiceRoutes = require('../features/billing/routes/invoice.routes');
const receiptRoutes = require('../features/billing/routes/receipt.routes');
const expenseRoutes = require('../features/billing/routes/expense.routes');
const documentRoutes = require('../features/documents/routes/document.routes');
const reportRoutes = require('../features/reports/routes/report.routes');
const settingsRoutes = require('../features/settings/routes/settings.routes');
const complianceRoutes = require('../features/compliance/routes/compliance.routes');
const portalRoutes = require('../features/portal/routes/portal.routes');
const departmentRoutes = require('../features/departments/routes/department.routes');
const attendanceRoutes = require('../features/attendance/routes/attendance.routes');
const activityRoutes = require('./activity.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/clients', clientRoutes);
router.use('/leads', leadRoutes);
router.use('/khatabook', khataRoutes);
router.use('/reminders', reminderRoutes);
router.use('/notifications', notificationRoutes);
router.use('/tasks', taskRoutes);
router.use('/task-templates', taskTemplateRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/receipts', receiptRoutes);
router.use('/expenses', expenseRoutes);
router.use('/documents', documentRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/compliance', complianceRoutes);
router.use('/portal', portalRoutes);
router.use('/departments', departmentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/activity', activityRoutes);

module.exports = router;
