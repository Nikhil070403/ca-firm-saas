import './MonthCalendar.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function MonthCalendar({ year, month, reminders, onSelectDay }) {
  const cells = buildGrid(year, month);
  const byDay = reminders.reduce((acc, r) => {
    const day = new Date(r.dueDate).getDate();
    acc[day] = acc[day] || [];
    acc[day].push(r);
    return acc;
  }, {});
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="month-calendar">
      <div className="month-calendar__weekdays">
        {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
      </div>
      <div className="month-calendar__grid">
        {cells.map((day, idx) => (
          <div
            key={idx}
            className={`month-calendar__cell ${day ? '' : 'is-empty'} ${isCurrentMonth && day === today.getDate() ? 'is-today' : ''}`}
            onClick={day && byDay[day] ? () => onSelectDay(day, byDay[day]) : undefined}
          >
            {day && (
              <>
                <span className="month-calendar__day">{day}</span>
                {byDay[day] && <span className="month-calendar__dot-count">{byDay[day].length}</span>}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
