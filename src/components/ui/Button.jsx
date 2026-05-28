import { Loader2 } from "lucide-react";
const variantClasses = {
  primary: "bg-teal text-white hover:bg-teal/90 focus-visible:ring-teal",
  secondary: "border border-line bg-white text-ink hover:bg-mist focus-visible:ring-teal",
  ghost: "text-graphite hover:bg-mist focus-visible:ring-teal",
  danger: "bg-ember text-white hover:bg-ember/90 focus-visible:ring-ember"
};
function Button({
  className = "",
  variant = "primary",
  isLoading = false,
  leftIcon,
  children,
  disabled,
  ...props
}) {
  return <button
    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
    disabled={disabled || isLoading}
    {...props}
  >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : leftIcon}
      <span>{children}</span>
    </button>;
}
export {
  Button
};
