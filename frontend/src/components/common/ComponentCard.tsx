// components/common/ComponentCard.tsx
import React from "react";

interface ComponentCardProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  desc?: React.ReactNode;
  actions?: React.ReactNode; // Boutons d'action optionnels
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
  actions,
}) => {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {/* Card Header */}
      {(title || desc || actions) && (
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {title && (
                <div className="text-base font-medium text-gray-800 dark:text-white/90">
                  {title}
                </div>
              )}
              {desc && (
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {desc}
                </div>
              )}
            </div>
            {actions && <div className="flex-shrink-0 ml-4">{actions}</div>}
          </div>
        </div>
      )}

      {/* Card Body */}
      <div
        className={`${
          title || desc || actions
            ? "p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6"
            : "p-6"
        }`}
      >
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;
