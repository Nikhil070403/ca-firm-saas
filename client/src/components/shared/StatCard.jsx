import './StatCard.css';

const TONE_CLASS = {
  primary: 'stat-card__icon--primary',
  success: 'stat-card__icon--success',
  warning: 'stat-card__icon--warning',
  danger: 'stat-card__icon--danger',
};

export default function StatCard({ label, value, icon: Icon, tone = 'primary', trend }) {
  return (
    <div className="stat-card">
      <div className={`stat-card__icon ${TONE_CLASS[tone]}`}>
        <Icon size={18} />
      </div>
      <div className="stat-card__body">
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
        {trend && <p className="stat-card__trend">{trend}</p>}
      </div>
    </div>
  );
}
