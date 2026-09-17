/**
 * Statutory calendar rules (India, per firm's spec):
 *
 * GSTR-1  monthly   -> due 11th of the following month; reminders from the 4th of the due month.
 * GSTR-1  quarterly -> due 13th of the month after the quarter ends; reminders from the 4th.
 * GSTR-3B monthly   -> due 20th of the following month; reminders from the 14th of the due month.
 * GSTR-3B quarterly -> due 24th of the month after the quarter ends; reminders from the 14th.
 * Yearly (for FY ending 31 Mar): ITR 31 Jul, Tax Audit 30 Sep, ROC 30 Nov, GSTR-9C 31 Dec.
 * Yearly reminders start 30 days before the due date.
 *
 * All reminders repeat daily (max one per day per return) until marked filed.
 */

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const GST_RULES = {
  gstr1: { monthlyDueDay: 11, quarterlyDueDay: 13, remindFromDay: 4 },
  gstr3b: { monthlyDueDay: 20, quarterlyDueDay: 24, remindFromDay: 14 },
};

// Month index (0-based) the yearly filing is due in, in the calendar year the FY ends.
const YEARLY_RULES = {
  itr: { dueMonth: 6, dueDay: 31, label: 'Income Tax Return' },      // 31 Jul
  audit: { dueMonth: 8, dueDay: 30, label: 'Tax Audit' },            // 30 Sep
  roc: { dueMonth: 10, dueDay: 30, label: 'ROC (MCA) Filing' },      // 30 Nov
  gstr9c: { dueMonth: 11, dueDay: 31, label: 'GSTR-9C Annual' },     // 31 Dec
};

const YEARLY_REMIND_DAYS_BEFORE = 30;

function monthLabel(year, monthIdx) {
  return `${MONTH_NAMES[monthIdx]} ${year}`;
}

/** The month whose data is currently filable = the previous calendar month. */
function currentMonthlyPeriod(now = new Date()) {
  const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const m = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  return { year: y, monthIdx: m };
}

/** The last fully completed India-FY quarter (Apr–Jun, Jul–Sep, Oct–Dec, Jan–Mar). */
function currentQuarterlyPeriod(now = new Date()) {
  const quarterEndMonths = [2, 5, 8, 11]; // Mar, Jun, Sep, Dec
  let y = now.getFullYear();
  let endIdx = null;
  for (let i = quarterEndMonths.length - 1; i >= 0; i -= 1) {
    if (now.getMonth() > quarterEndMonths[i]) { endIdx = quarterEndMonths[i]; break; }
  }
  if (endIdx === null) { y -= 1; endIdx = 11; } // Jan/Feb/Mar -> Oct–Dec of last year... except Mar+1
  return { year: y, endMonthIdx: endIdx, startMonthIdx: endIdx - 2 };
}

/** GST period + due date for a client's filing frequency, as of `now`. */
function gstPeriodFor(returnType, frequency, now = new Date()) {
  const rule = GST_RULES[returnType];
  if (frequency === 'monthly') {
    const { year, monthIdx } = currentMonthlyPeriod(now);
    const dueYear = monthIdx === 11 ? year + 1 : year;
    const dueMonthIdx = (monthIdx + 1) % 12;
    return {
      periodKey: `${year}-${String(monthIdx + 1).padStart(2, '0')}`,
      periodLabel: monthLabel(year, monthIdx),
      dueDate: new Date(dueYear, dueMonthIdx, rule.monthlyDueDay),
      remindFrom: new Date(dueYear, dueMonthIdx, rule.remindFromDay),
    };
  }
  const { year, endMonthIdx, startMonthIdx } = currentQuarterlyPeriod(now);
  const dueYear = endMonthIdx === 11 ? year + 1 : year;
  const dueMonthIdx = (endMonthIdx + 1) % 12;
  return {
    periodKey: `${year}-Q${String(endMonthIdx + 1).padStart(2, '0')}`,
    periodLabel: `${MONTH_NAMES[startMonthIdx < 0 ? startMonthIdx + 12 : startMonthIdx]}–${MONTH_NAMES[endMonthIdx]} ${year}`,
    dueDate: new Date(dueYear, dueMonthIdx, rule.quarterlyDueDay),
    remindFrom: new Date(dueYear, dueMonthIdx, rule.remindFromDay),
  };
}

/** The last completed financial year (FY ends 31 Mar). */
function currentYearlyPeriod(now = new Date()) {
  const fyEndYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return { fyStartYear: fyEndYear - 1, fyEndYear };
}

function yearlyPeriodFor(returnType, now = new Date()) {
  const rule = YEARLY_RULES[returnType];
  const { fyStartYear, fyEndYear } = currentYearlyPeriod(now);
  const dueDate = new Date(fyEndYear, rule.dueMonth, rule.dueDay);
  return {
    periodKey: `FY${fyStartYear}-${String(fyEndYear).slice(2)}`,
    periodLabel: `FY ${fyStartYear}-${String(fyEndYear).slice(2)}`,
    dueDate,
    remindFrom: new Date(dueDate.getTime() - YEARLY_REMIND_DAYS_BEFORE * 24 * 60 * 60 * 1000),
  };
}

const RETURN_TYPE_LABELS = {
  gstr1: 'GSTR-1',
  gstr3b: 'GSTR-3B',
  itr: 'Income Tax Return',
  gstr9c: 'GSTR-9C',
  roc: 'ROC (MCA)',
  audit: 'Audit',
};

module.exports = {
  GST_RULES,
  YEARLY_RULES,
  RETURN_TYPE_LABELS,
  gstPeriodFor,
  yearlyPeriodFor,
  currentMonthlyPeriod,
  currentQuarterlyPeriod,
  currentYearlyPeriod,
};
