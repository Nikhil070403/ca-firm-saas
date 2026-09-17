import './FormField.css';

export default function FormField({ label, htmlFor, error, hint, required, children }) {
  return (
    <div className="form-field">
      {label && (
        <label htmlFor={htmlFor} className="form-field__label">
          {label} {required && <span className="form-field__required">*</span>}
        </label>
      )}
      {children}
      {error && <p className="form-field__error">{error}</p>}
      {!error && hint && <p className="form-field__hint">{hint}</p>}
    </div>
  );
}
