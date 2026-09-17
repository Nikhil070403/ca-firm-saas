import './Card.css';

export function Card({ children, className = '', title, subtitle, action, ...rest }) {
  return (
    <div className={`card ${className}`} {...rest}>
      {(title || subtitle || action) && <CardHeader title={title} subtitle={subtitle} action={action} />}
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="card__header">
      <div>
        <h3 className="card__title">{title}</h3>
        {subtitle && <p className="card__subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export default Card;
