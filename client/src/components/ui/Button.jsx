import { Loader2 } from 'lucide-react';
import './Button.css';

const VARIANT_CLASS = {
  primary: 'btn btn--primary',
  secondary: 'btn btn--secondary',
  danger: 'btn btn--danger',
  ghost: 'btn btn--ghost',
  outline: 'btn btn--outline',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  icon: Icon,
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      className={`${VARIANT_CLASS[variant] || VARIANT_CLASS.primary} btn--${size} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="btn__spinner" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}
