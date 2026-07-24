import ZappIcon from '@/components/common/ZappIcon';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ICON_MAP: Record<string, string> = {
  shoppinglist: 'cart',
  tasks: 'checkbox-marked',
  index: 'home-variant',
};

const LABEL_MAP: Record<string, string> = {
  shoppinglist: 'Compras',
  tasks: 'Tarefas',
  index: 'Início',
};

function DockItem({
  routeName,
  isFocused,
  onPress,
  onLongPress,
}: {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const bgOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0, 147, 148, ${bgOpacity.value * 0.08})`,
  }));

  const handlePressIn = useCallback(() => {
    bgOpacity.value = withTiming(1, { duration: 120 });
  }, [bgOpacity]);

  const handlePressOut = useCallback(() => {
    bgOpacity.value = withTiming(0, { duration: 180 });
  }, [bgOpacity]);

  const iconName = (ICON_MAP[routeName] as any) || 'circle';
  const label = LABEL_MAP[routeName] || routeName;
  const color = isFocused ? Colors.light.primary : Colors.light.tabIconDefault;

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.item, animatedStyle]}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
    >
      <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
        <ZappIcon name={iconName} size={20} color={color} />
      </View>
      <Text style={[styles.label, { color }, isFocused && styles.labelFocused]} numberOfLines={1}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export default function DockTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.dock}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <DockItem
              key={route.key}
              routeName={route.name}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  item: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 4,
    borderRadius: 10,
  },
  iconWrap: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapActive: {
    backgroundColor: `${Colors.light.primary}10`,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  labelFocused: {
    fontWeight: '700',
  },
});
