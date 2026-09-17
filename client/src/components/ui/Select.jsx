import './FormField.css';

export default function Select({ error, className = '', options = [], placeholder, ...rest }) {
  return (
    <select className={`select ${error ? 'has-error' : ''} ${className}`} {...rest}>
      {placeholder && <option key="__placeholder" value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
