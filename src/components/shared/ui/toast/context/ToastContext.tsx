import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import logger from '@/lib/logger';
import { createAudioPlayer } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import type { Toast, ToastContextValue, ToastOptions } from '../types';

const DEFAULT_TOAST_OPTIONS: Omit<Required<ToastOptions>, 'backgroundColor'> = {
  duration: 3000,
  type: 'default',
  position: 'bottom',
  onClose: () => {},
  action: null,
  expandedContent: null,
  style: {},
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [expandedToasts, setExpandedToasts] = useState<Set<string>>(new Set());
  const playerRef = useRef<AudioPlayer | null>(null);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    try {
      playerRef.current = createAudioPlayer(
        require('../../../../../assets/audio/notification2.wav'),
      );
    } catch (error) {
      logger.warn('[Toast] Erro ao carregar som:', error);
    }
    return () => {
      playerRef.current?.remove();
    };
  }, []);

  const playSound = useCallback(async () => {
    try {
      if (playerRef.current) {
        playerRef.current.seekTo(0);
        playerRef.current.play();
      }
    } catch {}
  }, []);

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    setExpandedToasts((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  const show = useCallback(
    (content: React.ReactNode | string, options?: ToastOptions): string => {
      const id = Math.random().toString(36).substring(2, 9);
      const toast: Toast = {
        id,
        content,
        options: {
          ...DEFAULT_TOAST_OPTIONS,
          ...options,
        },
      };
      setToasts((prevToasts) => [...prevToasts, toast]);
      playSound();

      if (toast.options.duration > 0) {
        const timer = setTimeout(() => {
          dismiss(id);
          toast.options.onClose?.();
        }, toast.options.duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [playSound, dismiss],
  );

  const update = useCallback(
    (id: string, content: React.ReactNode | string, options?: ToastOptions) => {
      setToasts((prevToasts) =>
        prevToasts.map((toast) =>
          toast.id === id
            ? {
                ...toast,
                content,
                options: {
                  ...toast.options,
                  ...options,
                },
              }
            : toast,
        ),
      );
    },
    [],
  );

  const dismissAll = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setToasts([]);
    setExpandedToasts(new Set());
  }, []);

  const expandToast = useCallback((id: string) => {
    setExpandedToasts((prev) => {
      const newSet = new Set(prev);
      if (newSet.size >= 3 && !newSet.has(id)) {
        const firstId = Array.from(newSet)[0];
        newSet.delete(firstId);
      }
      newSet.add(id);
      return newSet;
    });
  }, []);

  const collapseToast = useCallback((id: string) => {
    setExpandedToasts((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value: ToastContextValue = useMemo(
    () => ({
      toasts,
      show,
      update,
      dismiss,
      dismissAll,
      expandedToasts,
      expandToast,
      collapseToast,
    }),
    [toasts, expandedToasts, show, update, dismiss, dismissAll, expandToast, collapseToast],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};
