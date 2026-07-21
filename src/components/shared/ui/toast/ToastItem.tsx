import { useToast } from './context/ToastContext';
import type { Toast as ToastType, ToastType as ToastVariant } from './types';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

interface ToastItemProps {
  toast: ToastType;
  index: number;
}

const getBackgroundColor = (type: ToastVariant) => {
  switch (type) {
    case 'success':
      return '#10B981';
    case 'error':
      return '#DC2626';
    case 'warning':
      return '#F59E0B';
    case 'info':
      return '#3B82F6';
    default:
      return '#5ea502';
  }
};

const getIconForType = (type: ToastVariant) => {
  switch (type) {
    case 'success':
      return '\u2713';
    case 'error':
      return '\u2717';
    case 'warning':
      return '\u26A0';
    case 'info':
      return '\u2139';
    default:
      return '';
  }
};

export const ToastItem: React.FC<ToastItemProps> = ({ toast, index }) => {
  const { dismiss, expandedToasts, expandToast, collapseToast } = useToast();
  const opacity = useSharedValue<number>(1);
  const translateY = useSharedValue<number>(toast.options.position === 'top' ? -100 : 100);
  const scale = useSharedValue<number>(0.9);
  const rotateZ = useSharedValue<number>(0);
  const expandHeight = useSharedValue<number>(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const position = toast.options.position;

  const getStackOffset = useCallback(() => {
    const baseOffset = 4;
    const maxOffset = 12;
    const offset = Math.min(index * baseOffset, maxOffset);
    return position === 'top' ? offset : -offset;
  }, [index, position]);

  const getStackScale = useCallback(() => {
    const scaleReduction = 0.02;
    const minScale = 0.92;
    return Math.max(1 - index * scaleReduction, minScale);
  }, [index]);

  const handleDismiss = useCallback(() => {
    dismiss(toast.id);
    toast.options.onClose?.();
  }, [dismiss, toast.id, toast.options]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, []);
  const isExpanded = expandedToasts.has(toast.id);
  const hasExpandedContent = !!toast.options.expandedContent;

  useEffect(() => {
    const soonerOffset = position === 'top' ? 2 : -2;
    translateY.value = withTiming(getStackOffset() + soonerOffset, {
      duration: 400,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    });
    scale.value = withTiming(getStackScale() * 0.98, {
      duration: 400,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    });
    timeoutsRef.current.push(
      setTimeout(() => {
        translateY.value = withSpring(getStackOffset(), {
          damping: 25,
          stiffness: 120,
          mass: 0.8,
          velocity: 0,
        });
        scale.value = withSpring(getStackScale(), {
          damping: 25,
          stiffness: 120,
          mass: 0.8,
          velocity: 0,
        });
      }, 200),
    );
  }, [getStackOffset, getStackScale, position, scale, translateY]);

  const animatedDismiss = () => {
    opacity.value = withTiming(0, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    });
    translateY.value = withTiming(position === 'top' ? -50 : 50, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    });
    scale.value = withTiming(0.85, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    });
    timeoutsRef.current.push(
      setTimeout(() => {
        handleDismiss();
      }, 300),
    );
  };

  useEffect(() => {
    const delay = index * 50;
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    timeoutsRef.current.push(
      setTimeout(() => {
        translateY.value = withSpring(getStackOffset(), {
          damping: 28,
          stiffness: 140,
          mass: 0.8,
          velocity: 0,
        });
        scale.value = withSpring(getStackScale(), {
          damping: 28,
          stiffness: 140,
          mass: 0.8,
          velocity: 0,
        });
        rotateZ.value = withTiming(0, {
          duration: 500,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        });
      }, delay),
    );

    if (toast.options.duration > 0) {
      const exitDelay = Math.max(0, toast.options.duration - 500);
      const exitAnimations = () => {
        opacity.value = withTiming(0, {
          duration: 400,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        });
        const exitOffset = position === 'top' ? -20 : 20;
        translateY.value = withTiming(exitOffset, {
          duration: 400,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        });
        scale.value = withTiming(0.95, {
          duration: 400,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        });
        timeoutsRef.current.push(
          setTimeout(() => {
            handleDismiss();
          }, 400),
        );
      };
      timeoutsRef.current.push(setTimeout(exitAnimations, exitDelay));
    }
  }, [
    getStackOffset,
    getStackScale,
    handleDismiss,
    index,
    opacity,
    position,
    rotateZ,
    scale,
    translateY,
    toast.options.duration,
  ]);

  useEffect(() => {
    if (isExpanded && hasExpandedContent) {
      expandHeight.value = withSpring(1, {
        damping: 20,
        stiffness: 100,
      });
    } else {
      expandHeight.value = withSpring(0, {
        damping: 20,
        stiffness: 100,
      });
    }
  }, [expandHeight, hasExpandedContent, isExpanded]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
        { rotateZ: `${rotateZ.value}deg` },
      ],
      zIndex: 1000 - index,
    };
  });

  const expandedContentStyle = useAnimatedStyle(() => {
    return {
      maxHeight: expandHeight.value * 300,
      opacity: expandHeight.value,
    };
  });

  const handlePress = () => {
    if (!hasExpandedContent) return;
    if (isExpanded) {
      collapseToast(toast.id);
    } else {
      expandToast(toast.id);
    }
  };

  const backgroundColor = getBackgroundColor(toast.options.type);
  const _styles = toast.options?.style || {};
  const icon = getIconForType(toast.options.type);

  const renderExpandedContent = () => {
    if (!hasExpandedContent) return null;
    const content = toast.options.expandedContent;
    if (typeof content === 'function') {
      return content({ dismiss: animatedDismiss });
    }
    return content;
  };

  const positionStyle = useMemo(
    () => ({
      marginTop: 0,
      marginBottom: 0,
      position: 'absolute' as const,
      top: position === 'top' ? 80 : undefined,
      bottom: position === 'bottom' ? 0 : undefined,
    }),
    [position],
  );

  return (
    <Animated.View style={[styles.toastContainer, animatedStyle, positionStyle, _styles]}>
      <Pressable
        style={[styles.toast, { backgroundColor }]}
        onPress={handlePress}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}
      >
        <View style={styles.mainContent}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <View style={styles.contentContainer}>
            {typeof toast.content === 'string' ? (
              <Text style={styles.text}>{toast.content}</Text>
            ) : (
              toast.content
            )}
          </View>
          {toast.options.action && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                toast.options.action?.onPress?.();
                animatedDismiss();
              }}
            >
              <Text style={styles.actionText}>{toast.options.action.label}</Text>
            </TouchableOpacity>
          )}
        </View>
        {hasExpandedContent && (
          <Animated.View style={[styles.expandedContent, expandedContentStyle]}>
            {renderExpandedContent()}
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
    marginVertical: 4,
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  toast: {
    flexDirection: 'column',
    borderRadius: 12,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    color: '#fff',
    fontSize: 20,
    marginRight: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 24,
  },
  contentContainer: {
    flex: 1,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: 12,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  expandedContent: {
    overflow: 'hidden',
  },
});
