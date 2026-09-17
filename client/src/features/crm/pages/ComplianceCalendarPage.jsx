import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { complianceApi, RETURN_TYPE_LABELS } from '../services/compliance.service';
import useApiData from '../../../hooks/useApiData';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import { formatDate } from '../../../utils/format';
import './ComplianceCalendarPage.css';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Color coding per spec: green = filed, red = overdue, orange = upcoming.
function statusColor(ret, now) {
  if (ret.status === 'filed') return 'filed';
  if (new Date(ret.dueDate) < now) return 'overdue';
  return 'upcoming';
}

/**
 * Month grid over every ComplianceReturn due date. Clicking a day pins its
 * returns into the side panel; month navigation refetches nothing — the
 * whole current dataset is small enough to slice client-side.
 */
export default function ComplianceCalendarPage() {
  const navigate = useNavigate();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDay, setSelectedDay] = useState(null);

  const { data, loading } = useApiData(() => complianceApi.list({ limit: 500, sort: 'dueDate' }), []);
  const returns = data?.data || [];

  const byDay = useMemo(() => {
    const map = {};
    returns.forEach((ret) => {
      const d = new Date(ret.dueDate);
      if (d.getFullYear() !== cursor.year || d.getMonth() !== cursor.month) return;
      const key = d.getDate();
      (map[key] = map[key] || []).push(ret);
    });
    return map;
  }, [returns, cursor]);

  const cells = useMemo(() => {
    const firstDay = new Date(cursor.year, cursor.month, 1);
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const leadingBlanks = (firstDay.getDay() + 6) % 7; // Monday-first
    return [
      ...Array.from({ length: leadingBlanks }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
  }, [cursor]);

  const moveMonth = (delta) => {
    setSelectedDay(null);
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const dayReturns = selectedDay ? (byDay[selectedDay] || []) : [];
  const isToday = (day) => day === now.getDate() && cursor.month === now.getMonth() && cursor.year === now.getFullYear();

  if (loading) return <div style={{ padding: '60px 0' }}><Spinner label="Loading calendar…" /></div>;

  return (
    <div className="comp-cal">
      <div className="comp-cal__header">
        <div>
          <h1>Compliance Calendar</h1>
          <p>
            <span className="comp-cal__legend is-filed">Filed</span>
            <span className="comp-cal__legend is-upcoming">Upcoming</span>
            <span className="comp-cal__legend is-overdue">Overdue</span>
          </p>
        </div>
        <div className="comp-cal__nav no-print">
          <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month"><ChevronLeft size={17} /></button>
          <span>{MONTHS[cursor.month]} {cursor.year}</span>
          <button type="button" onClick={() => moveMonth(1)} aria-label="Next month"><ChevronRight size={17} /></button>
        </div>
      </div>

      <div className="comp-cal__layout">
        <Card style={{ padding: 14 }}>
          <div className="comp-cal__grid">
            {WEEKDAYS.map((d) => <div key={d} className="comp-cal__weekday">{d}</div>)}
            {cells.map((day, i) => (
              day === null
                ? <div key={`blank-${i}`} className="comp-cal__cell is-blank" />
                : (
                  <button
                    key={day}
                    type="button"
                    className={`comp-cal__cell ${isToday(day) ? 'is-today' : ''} ${selectedDay === day ? 'is-selected' : ''}`}
                    onClick={() => setSelectedDay(day)}
                  >
                    <span className="comp-cal__daynum">{day}</span>
                    <span className="comp-cal__dots">
                      {(byDay[day] || []).slice(0, 4).map((ret) => (
                        <span key={ret._id} className={`comp-cal__dot is-${statusColor(ret, now)}`} />
                      ))}
                      {(byDay[day] || []).length > 4 && <span className="comp-cal__more">+{byDay[day].length - 4}</span>}
                    </span>
                  </button>
                )
            ))}
          </div>
        </Card>

        <Card
          title={selectedDay ? `${selectedDay} ${MONTHS[cursor.month]} ${cursor.year}` : 'Select a day'}
          subtitle={selectedDay ? `${dayReturns.length} return(s) due` : 'Click a highlighted day to see what is due'}
        >
          {selectedDay && dayReturns.length === 0 && (
            <p className="comp-cal__empty">Nothing due on this day.</p>
          )}
          <div className="comp-cal__list">
            {dayReturns.map((ret) => {
              const color = statusColor(ret, now);
              return (
                <button
                  key={ret._id}
                  type="button"
                  className="comp-cal__item"
                  onClick={() => navigate(`/crm/compliance/${ret.returnType === 'gstr1' || ret.returnType === 'gstr3b' ? ret.returnType : 'yearly'}`)}
                >
                  <span className={`comp-cal__dot is-${color}`} />
                  <span className="comp-cal__item-body">
                    <strong>{RETURN_TYPE_LABELS[ret.returnType]}</strong>
                    <span>{ret.clientId?.displayName} · {ret.periodLabel} · due {formatDate(ret.dueDate)}</span>
                  </span>
                  <Badge tone={color === 'filed' ? 'success' : color === 'overdue' ? 'danger' : 'warning'}>
                    {color}
                  </Badge>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
