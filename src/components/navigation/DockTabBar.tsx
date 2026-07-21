import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import React, { useCallback, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ICON_MAP: Record<string, string> = {
  shoppinglist: "cart",
  tasks: "checkbox-marked",
  index: "home-variant",
};

const LABEL_MAP: Record<string, string> = {
  shoppinglist: "Compras",
  tasks: "Tarefas",
  index: "Início",
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
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, {
      damping: 12,
      stiffness: 300,
      mass: 0.5,
    });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 200,
      mass: 0.8,
    });
  }, []);

  const iconName = (ICON_MAP[routeName] as any) || "circle";
  const label = LABEL_MAP[routeName] || routeName;
  const color = isFocused ? Colors.light.tint : Colors.light.tabIconDefault;

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
      <MaterialCommunityIcons name={iconName} size={24} color={color} />
      <Text
        style={[styles.label, { color }, isFocused && styles.labelFocused]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export default function DockTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const shimmerOpacity = useSharedValue(0.35);

  const DOCK_PADDING = 8;
  const ITEM_WIDTH = 58;

  const indicatorX = useSharedValue(0);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: ITEM_WIDTH,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));

  useEffect(() => {
    shimmerOpacity.value = withRepeat(
      withSequence(
        withTiming(0.82, { duration: 950 }),
        withTiming(0.45, { duration: 1100 }),
      ),
      -1,
      true,
    );
  }, [shimmerOpacity]);

  React.useEffect(() => {
    indicatorX.value = withTiming(DOCK_PADDING + state.index * ITEM_WIDTH, {
      duration: 260,
    });
  }, [state.index]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 28 }]}>
      <View style={styles.dock}>
        <Animated.View style={[styles.indicator, indicatorStyle]}>
          <Animated.View style={[styles.indicatorPill, shimmerStyle]} />
        </Animated.View>

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
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
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    zIndex: 100,
  },
  dock: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 24,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  indicator: {
    position: "absolute",
    top: 4,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  indicatorPill: {
    width: 40,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.accentPurpleSurface,
    borderWidth: 1,
    borderColor: "rgba(175, 82, 222, 0.15)",
  },
  item: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.2,
    marginTop: 4,
  },
  labelFocused: {
    fontWeight: "700",
  },
});
