import './Input.scss';

export function Input({ className = '', invalid = false, ...rest }) {
  const cls = ['input', invalid ? 'input--invalid' : '', className].filter(Boolean).join(' ');
  return <input className={cls} {...rest} />;
}

export function Textarea({ className = '', invalid = false, ...rest }) {
  const cls = ['input', 'input--textarea', invalid ? 'input--invalid' : '', className]
    .filter(Boolean)
    .join(' ');
  return <textarea className={cls} {...rest} />;
}

export function Select({ className = '', invalid = false, children, ...rest }) {
  const cls = ['input', 'input--select', invalid ? 'input--invalid' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <select className={cls} {...rest}>
      {children}
    </select>
  );
}
