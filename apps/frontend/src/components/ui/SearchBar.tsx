import type { InputHTMLAttributes } from "react";
import Icon from "../Icon";

interface SearchBarProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  hint?: string;
}

export default function SearchBar({
  value = "",
  onChange,
  label,
  hint,
  placeholder = "Search...",
  className = "",
  disabled,
  ...rest
}: SearchBarProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-normal text-text-muted">
          {label}
          {hint && (
            <span className="text-text-muted ml-1 text-xs opacity-60">
              ({hint})
            </span>
          )}
        </label>
      )}
      <div className="relative w-full">
        <Icon
          name="search"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          className={`w-full bg-raised border border-line-strong rounded pl-10 pr-4 h-11 text-text-main placeholder:text-ink-3 focus:border-brand-ink focus:ring-0 transition-all ${
            disabled
              ? "opacity-50 cursor-not-allowed bg-surface-variant/50"
              : ""
          } ${className}`}
          placeholder={placeholder}
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          {...rest}
        />
      </div>
    </div>
  );
}
