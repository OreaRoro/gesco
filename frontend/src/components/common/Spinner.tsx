import React from "react";

type Size = "sm" | "md" | "lg" | "xl";
type Color = "primary" | "muted" | "white";

interface SpinnerProps {
  size?: Size;
  color?: Color;
  className?: string;
  label?: string; // label visible (optional)
  ariaLabel?: string; // accessibility label (defaults to "Loading")
}

/**
 * Simple accessible spinner using Tailwind.
 * - size: controls width/height
 * - color: controls border color
 */
const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  color = "primary",
  className = "",
  label,
  ariaLabel = "Loading",
}) => {
  const sizeClasses: Record<Size, string> = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-4",
    xl: "w-12 h-12 border-4",
  };

  const colorClasses: Record<Color, string> = {
    primary: "border-t-brand-500 border-gray-200 dark:border-gray-700",
    muted: "border-t-gray-500 border-gray-200 dark:border-gray-600",
    white: "border-t-white border-white/30",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <span
        className={`${sizeClasses[size]} animate-spin rounded-full ${colorClasses[color]}`}
        aria-hidden="true"
      />
      {label ? (
        <span className="text-sm text-gray-100 dark:text-gray-300">
          {label}
        </span>
      ) : (
        /* visually hidden text for screen readers if no visible label */
        <span className="sr-only">{ariaLabel}</span>
      )}
    </div>
  );
};

export default Spinner;
