/**
 * Every *.model.js registers itself with Mongoose as a side effect of being
 * require()-d. Anything that populates a ref (e.g. `.populate('clientId')`)
 * needs that model already registered, so this file is required first thing
 * in server.js before any route/service code runs.
 */
require('./ActivityLog.model');
require('../features/settings/models/Firm.model');
require('../features/settings/models/EmailTemplate.model');
require('../features/auth/models/User.model');
require('../features/auth/models/RefreshToken.model');
require('../features/clients/models/Client.model');
require('../features/clients/models/CommunicationLog.model');
require('../features/crm/models/Lead.model');
require('../features/crm/models/LeadActivity.model');
require('../features/khatabook/models/LedgerEntry.model');
require('../features/reminders/models/Reminder.model');
require('../features/reminders/models/Notification.model');
require('../features/tasks/models/Task.model');
require('../features/billing/models/Invoice.model');
require('../features/billing/models/Receipt.model');
require('../features/billing/models/Expense.model');
require('../features/documents/models/Document.model');
require('../features/documents/models/DocumentFolder.model');
require('../features/compliance/models/ComplianceReturn.model');
