import { useEffect, useRef } from "react";
import gsap from "gsap";
import {
  AlertIcon,
  InfoIcon,
  ErrorIcon,
  CheckCircleIcon,
  CloseIcon,
} from "../../icons";

export type ModalType = "warning" | "danger" | "info" | "success";
export type ModalSize = "sm" | "md" | "lg" | "xl";

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action?: string) => void;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: ModalType;
  size?: ModalSize;
  icon?: React.ReactNode;
  customContent?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  actions?: {
    label: string;
    action: string;
    variant: "primary" | "secondary" | "danger";
    icon?: React.ReactNode;
  }[];
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = "warning",
  size = "md",
  icon,
  customContent,
  showCloseButton = true,
  closeOnOverlayClick = true,
  actions,
}: ConfirmationModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Gestion touche ESC et scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";

      // Animation d'ouverture avec GSAP
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      );

      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
      );
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Fermeture animée
  const handleClose = () => {
    if (!modalRef.current || !overlayRef.current) return;

    gsap.to(modalRef.current, {
      opacity: 0,
      scale: 0.8,
      duration: 0.2,
      ease: "power2.in",
    });

    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2 });

    setTimeout(() => {
      onClose();
    }, 200);
  };

  if (!isOpen) return null;

  const getTypeConfig = () => {
    const config = {
      warning: {
        icon: icon || <AlertIcon className="w-6 h-6 text-amber-600" />,
        primaryButton:
          "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white",
        secondaryButton: "text-amber-600 hover:bg-amber-50 border-amber-300",
      },
      danger: {
        icon: icon || <ErrorIcon className="w-6 h-6 text-red-600" />,
        primaryButton:
          "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white",
        secondaryButton: "text-red-600 hover:bg-red-50 border-red-300",
      },
      info: {
        icon: icon || <InfoIcon className="w-6 h-6 text-blue-600" />,
        primaryButton:
          "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white",
        secondaryButton: "text-blue-600 hover:bg-blue-50 border-blue-300",
      },
      success: {
        icon: icon || <CheckCircleIcon className="w-6 h-6 text-green-600" />,
        primaryButton:
          "bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white",
        secondaryButton: "text-green-600 hover:bg-green-50 border-green-300",
      },
    };
    return config[type];
  };

  const getSizeConfig = () => {
    const sizes = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
    };
    return sizes[size];
  };

  const typeConfig = getTypeConfig();
  const sizeClass = getSizeConfig();

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={closeOnOverlayClick ? handleClose : undefined}
      />

      {/* Modal */}
      <div ref={modalRef} className={`relative w-full ${sizeClass} transform`}>
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
          {/* Header */}
          <div className="flex items-start gap-4 p-6 border-b border-gray-200 dark:border-gray-600">
            <div className="flex-shrink-0">{typeConfig.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 leading-6">
                  {title}
                </h3>
                {showCloseButton && (
                  <button
                    onClick={handleClose}
                    className="flex-shrink-0 p-1 text-gray-400 rounded-lg hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 transition-colors"
                  >
                    <CloseIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
              {message && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-5">
                  {message}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 p-6 border-t border-gray-200 dark:border-gray-400">
            {actions ? (
              <div className="space-y-3">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => onConfirm(action.action)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      action.variant === "primary"
                        ? typeConfig.primaryButton
                        : action.variant === "danger"
                        ? "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white"
                        : typeConfig.secondaryButton + " border bg-white"
                    }`}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
                <button
                  onClick={handleClose}
                  className="w-full px-4 py-3 text-gray-700 bg-white dark:bg-gray-800 dark:text-gray-50 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  {cancelText}
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => onConfirm()}
                  className={`flex-1 px-4 py-3 rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${typeConfig.primaryButton}`}
                >
                  {confirmText}
                </button>
                <button
                  onClick={handleClose}
                  className={`flex-1 px-4 py-3 bg-white dark:bg-gray-800 dark:text-gray-50 border rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${typeConfig.secondaryButton}`}
                >
                  {cancelText}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
