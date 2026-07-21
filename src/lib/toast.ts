import { Toast } from '@/components/shared/ui/toast';
import type { ToastType } from '@/components/shared/ui/toast/types';

const show = (message: string, variant: ToastType = 'default') => {
  Toast.show(message, { type: variant, position: 'top', duration: 2800 });
};

export const toast = {
  success: (message: string) => show(message, 'success'),
  error: (message: string) => show(message, 'error'),
  info: (message: string) => show(message, 'info'),
  warning: (message: string) => show(message, 'warning'),
};
