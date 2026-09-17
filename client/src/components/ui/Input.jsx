import './FormField.css';

export default function Input({ error, className = '', ...rest }) {
  return <input className={`input ${error ? 'has-error' : ''} ${className}`} {...rest} />;
}
