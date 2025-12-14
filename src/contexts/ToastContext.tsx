import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastConfig, ToastType, ToastManager } from '../components/common/Toast';

interface ToastContextType {
  showToast: (config: Omit<ToastConfig, 'id'>) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string, action?: ToastConfig['action']) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let toastIdCounter = 0;
const generateId = () => `toast-${++toastIdCounter}-${Date.now()}`;

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);

  const showToast = useCallback((config: Omit<ToastConfig, 'id'>) => {
    const id = generateId();
    const newToast: ToastConfig = { ...config, id };

    setToasts((prev) => {
      // Limit to 3 toasts max, remove oldest if needed
      const updated = [...prev, newToast];
      if (updated.length > 3) {
        return updated.slice(-3);
      }
      return updated;
    });
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, message, duration: 3000 });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string, action?: ToastConfig['action']) => {
    showToast({ type: 'error', title, message, action, duration: action ? 0 : 5000 });
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string) => {
    showToast({ type: 'warning', title, message, duration: 4000 });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, message, duration: 3000 });
  }, [showToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        dismissToast,
        dismissAll,
      }}
    >
      {children}
      <ToastManager toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastContext;
