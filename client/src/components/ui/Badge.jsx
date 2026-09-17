import './Badge.css';

export default function Badge({ children, tone = 'neutral', className = '', ...rest }) {
  return <span className={`badge badge--${tone} ${className}`} {...rest}>{children}</span>;
}
