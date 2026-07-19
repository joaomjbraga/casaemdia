import type { StyleProp, ViewStyle } from "react-native";
import type { ReactNode } from "react";

type ToastType = "info" | "warning" | "error" | "success" | "default";
type ToastPosition = "bottom" | "top";

interface ToastOptions {
  duration?: number;
  type?: ToastType;
  position?: ToastPosition;
  onClose?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  } | null;
  expandedContent?: ReactNode | ((props: { dismiss: () => void }) => ReactNode) | null;
  style?: StyleProp<ViewStyle>;
}

interface Toast {
  id: string;
  content: ReactNode | string;
  options: Omit<Required<ToastOptions>, "backgroundColor">;
}

interface ToastContextValue {
  toasts: Toast[];
  show: (content: ReactNode | string, options?: ToastOptions) => string;
  update: (id: string, content: ReactNode | string, options?: ToastOptions) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  expandedToasts: Set<string>;
  expandToast: (id: string) => void;
  collapseToast: (id: string) => void;
}

interface ToastProps {
  children: ReactNode;
}

export type {
  ToastType,
  ToastPosition,
  ToastOptions,
  Toast,
  ToastContextValue,
  ToastProps,
};
