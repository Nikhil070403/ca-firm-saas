const invoiceRepository = require('../../billing/repositories/invoice.repository');
const taskRepository = require('../../tasks/repositories/task.repository');
const reminderRepository = require('../../reminders/repositories/reminder.repository');
const leadRepository = require('../../crm/repositories/lead.repository');
const reportService = require('../../reports/services/report.service');
const activityLogService = require('../../../services/activityLog.service');

async function getOverview(firmId) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    revenue,
    outstanding,
    todaysTasks,
    taskStatusCounts,
    upcomingReminders,
    pipelineSummary,
    recentActivities,
    activeClientCount,
  ] = await Promise.all([
    invoiceRepository.revenueByMonth(firmId, 6),
    invoiceRepository.outstandingTotal(firmId),
    taskRepository.paginate(firmId, { filter: { dueDate: { $gte: startOfDay, $lt: endOfDay } }, limit: 10 }),
    taskRepository.countByStatus(firmId),
    reminderRepository.listDueBetween(firmId, now, next7Days),
    leadRepository.countByStatus(firmId),
    activityLogService.listRecentForFirm(firmId, { limit: 15 }),
    reportService.clientCount(firmId),
  ]);

  return {
    revenue: {
      monthly: revenue,
      outstandingTotal: outstanding[0]?.total || 0,
    },
    todaysTasks: todaysTasks.items,
    taskStatusCounts,
    upcomingReminders,
    leadPipeline: pipelineSummary,
    recentActivities,
    activeClientCount,
  };
}

module.exports = { getOverview };
