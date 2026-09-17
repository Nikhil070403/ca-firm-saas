import './FormField.css';

export default function Textarea({ error, className = '', ...rest }) {
  return <textarea className={`textarea ${error ? 'has-error' : ''} ${className}`} {...rest} />;
}
