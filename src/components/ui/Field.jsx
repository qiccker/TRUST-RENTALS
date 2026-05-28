function FieldShell({ label, hint, children }) {
  return <label className="grid gap-2 text-sm font-semibold text-ink">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-medium text-graphite">{hint}</span> : null}
    </label>;
}
const controlClasses = "min-h-11 rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-graphite/60 focus:border-teal focus:ring-2 focus:ring-teal/20";
function Input({ label, hint, className = "", ...props }) {
  return <FieldShell label={label} hint={hint}>
      <input className={`${controlClasses} ${className}`} {...props} />
    </FieldShell>;
}
function Select({ label, hint, className = "", children, ...props }) {
  return <FieldShell label={label} hint={hint}>
      <select className={`${controlClasses} ${className}`} {...props}>
        {children}
      </select>
    </FieldShell>;
}
function Textarea({ label, hint, className = "", ...props }) {
  return <FieldShell label={label} hint={hint}>
      <textarea className={`${controlClasses} min-h-28 resize-y ${className}`} {...props} />
    </FieldShell>;
}
export {
  Input,
  Select,
  Textarea
};
