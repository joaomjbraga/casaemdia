import { useToast } from './context/ToastContext';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToastItem } from './ToastItem';

export const ToastViewport: React.FC = () => {
  const { toasts } = useToast();
  const insets = useSafeAreaInsets();
  const topToasts = toasts.filter((toast) => toast.options.position === 'top');
  const bottomToasts = toasts.filter((toast) => toast.options.position === 'bottom');

  const topViewportStyle = useMemo(
    () => ({ paddingTop: insets.top + 10, height: 200 }),
    [insets.top],
  );

  const bottomViewportStyle = useMemo(
    () => ({ marginBottom: insets.bottom, height: 200 }),
    [insets.bottom],
  );

  return (
    <>
      <View style={[styles.viewport, styles.topViewport, topViewportStyle]}>
        {topToasts.map((toast, arrayIndex) => {
          const displayIndex = topToasts.length - 1 - arrayIndex;
          return <ToastItem key={toast.id} toast={toast} index={displayIndex} />;
        })}
      </View>
      <View style={[styles.viewport, styles.bottomViewport, bottomViewportStyle]}>
        {bottomToasts.map((toast, arrayIndex) => {
          const displayIndex = bottomToasts.length - 1 - arrayIndex;
          return <ToastItem key={toast.id} toast={toast} index={displayIndex} />;
        })}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
    pointerEvents: 'box-none',
  },
  topViewport: {
    top: 0,
    justifyContent: 'flex-start',
  },
  bottomViewport: {
    bottom: 0,
    justifyContent: 'flex-end',
  },
});
