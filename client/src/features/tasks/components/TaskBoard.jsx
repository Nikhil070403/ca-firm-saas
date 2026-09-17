import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import Badge from '../../../components/ui/Badge';
import UserLink from '../../../components/shared/UserLink';
import { formatDate } from '../../../utils/format';
import './TaskBoard.css';

export const TASK_STAGES = [
  { key: 'document_collection', label: 'Document Collection', accent: '#64748b' },
  { key: 'verification', label: 'Verification', accent: '#3b82f6' },
  { key: 'preparation', label: 'Preparation', accent: '#6366f1' },
  { key: 'review', label: 'Review', accent: '#f59e0b' },
  { key: 'partner_approval', label: 'Partner Approval', accent: '#f97316' },
  { key: 'filed', label: 'Filed', accent: '#10b981' },
  { key: 'completed', label: 'Completed', accent: '#059669' },
];

const PRIORITY_TONES = { low: 'neutral', medium: 'primary', high: 'warning', urgent: 'danger' };

/**
 * CA filing workflow board. Native HTML5 drag & drop (no library): drag a
 * card onto a column to move it; the parent persists the stage change and
 * owns the task array, so a failed save simply re-renders the old state.
 */
export default function TaskBoard({ tasks, onMove }) {
  const navigate = useNavigate();
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);

  const handleDrop = (stageKey) => {
    setOverStage(null);
    if (!dragId) return;
    const task = tasks.find((t) => t._id === dragId);
    setDragId(null);
    if (task && task.stage !== stageKey) onMove(task, stageKey);
  };

  return (
    <div className="task-board">
      {TASK_STAGES.map((stage) => {
        const cards = tasks.filter((t) => (t.stage || 'document_collection') === stage.key);
        return (
          <div
            key={stage.key}
            className={`task-board__col ${overStage === stage.key ? 'is-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setOverStage(stage.key); }}
            onDragLeave={() => setOverStage((s) => (s === stage.key ? null : s))}
            onDrop={() => handleDrop(stage.key)}
          >
            <div className="task-board__col-head">
              <span className="task-board__dot" style={{ background: stage.accent }} />
              <span className="task-board__col-title">{stage.label}</span>
              <span className="task-board__count">{cards.length}</span>
            </div>

            <div className="task-board__cards">
              {cards.map((task) => (
                <div
                  key={task._id}
                  className={`task-board__card ${dragId === task._id ? 'is-dragging' : ''}`}
                  draggable
                  onDragStart={() => setDragId(task._id)}
                  onDragEnd={() => { setDragId(null); setOverStage(null); }}
                  onClick={() => navigate(`/crm/tasks/${task._id}`)}
                >
                  <p className="task-board__card-title">{task.title}</p>
                  {task.clientId?.displayName && (
                    <p className="task-board__card-client">{task.clientId.displayName}</p>
                  )}
                  <div className="task-board__card-meta">
                    <Badge tone={PRIORITY_TONES[task.priority]}>{task.priority}</Badge>
                    {task.dueDate && (
                      <span className={`task-board__due ${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'is-overdue' : ''}`}>
                        <CalendarDays size={12} /> {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                  {task.assignedTo && (
                    <div className="task-board__card-owner" onClick={(e) => e.stopPropagation()}>
                      <span className="task-board__avatar">{task.assignedTo.name?.[0]?.toUpperCase()}</span>
                      <UserLink user={task.assignedTo} />
                    </div>
                  )}
                </div>
              ))}
              {cards.length === 0 && <p className="task-board__empty">Drop tasks here</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
