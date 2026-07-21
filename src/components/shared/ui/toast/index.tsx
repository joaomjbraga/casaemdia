import * as React from 'react';
import { ToastProvider, useToast } from './context/ToastContext';
import logger from '@/lib/logger';
import { ToastViewport } from './ToastViewport';
import type { ToastOptions } from './types';

type ToastRef = {
  show?: (content: React.ReactNode | string, options?: ToastOptions) => string;
  update?: (id: string, content: React.ReactNode | string, options?: ToastOptions) => void;
  dismiss?: (id: string) => void;
  dismissAll?: () => void;
};

const toastRef: ToastRef = {};

const ToastController: React.FC = () => {
  const toast = useToast();
  toastRef.show = toast.show;
  toastRef.update = toast.update;
  toastRef.dismiss = toast.dismiss;
  toastRef.dismissAll = toast.dismissAll;
  return null;
};

export const ToastProviderWithViewport: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <ToastProvider>
      <ToastController />
      {children}
      <ToastViewport />
    </ToastProvider>
  );
};

export const Toast = {
  show: (content: React.ReactNode | string, options?: ToastOptions): string => {
    if (!toastRef.show) {
      logger.error(
        'Toast provider not initialized. Make sure you have wrapped your app with ToastProviderWithViewport.',
      );
      return '';
    }
    return toastRef.show(content, options);
  },
  update: (id: string, content: React.ReactNode | string, options?: ToastOptions): void => {
    if (!toastRef.update) {
      logger.error(
        'Toast provider not initialized. Make sure you have wrapped your app with ToastProviderWithViewport.',
      );
      return;
    }
    return toastRef.update(id, content, options);
  },
  dismiss: (id: string): void => {
    if (!toastRef.dismiss) {
      logger.error(
        'Toast provider not initialized. Make sure you have wrapped your app with ToastProviderWithViewport.',
      );
      return;
    }
    return toastRef.dismiss(id);
  },
  dismissAll: (): void => {
    if (!toastRef.dismissAll) {
      logger.error(
        'Toast provider not initialized. Make sure you have wrapped your app with ToastProviderWithViewport.',
      );
      return;
    }
    return toastRef.dismissAll();
  },
};

export { ToastProvider, useToast } from './context/ToastContext';
export type { ToastOptions, ToastType, ToastPosition } from './types';
