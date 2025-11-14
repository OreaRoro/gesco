import { useState, useCallback } from "react";

export interface ModalConfig {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: "warning" | "danger" | "info" | "success";
  customContent?: React.ReactNode;
  actions?: {
    label: string;
    action: string;
    variant: "primary" | "secondary" | "danger";
    icon?: React.ReactNode;
  }[];
}

export const useConfirmationModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);
  const [resolvePromise, setResolvePromise] = useState<
    ((value: string | null) => void) | null
  >(null);

  const openModal = useCallback(
    (config: ModalConfig): Promise<string | null> => {
      return new Promise((resolve) => {
        setModalConfig(config);
        setIsOpen(true);
        setResolvePromise(() => resolve);
      });
    },
    []
  );

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setModalConfig(null);
    if (resolvePromise) {
      resolvePromise(null);
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  const confirm = useCallback(
    (action?: string) => {
      setIsOpen(false);
      if (resolvePromise) {
        resolvePromise(action || "confirmed");
        setResolvePromise(null);
      }
      setModalConfig(null);
    },
    [resolvePromise]
  );

  return {
    isOpen,
    modalConfig,
    openModal,
    closeModal,
    confirm,
  };
};
