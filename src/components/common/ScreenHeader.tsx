import Colors from "@/constants/Colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, useWindowDimensions, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenHeaderProps {
  iconName: string;
  title: string;
  subtitle?: string;
  iconBackgroundColor?: string;
  iconColor?: string;
  subtitleColor?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  style?: ViewStyle;
}

export default function ScreenHeader({
  iconName,
  title,
  subtitle,
  iconBackgroundColor = "rgba(0, 122, 255, 0.08)",
  iconColor = Colors.light.primary,
  subtitleColor = Colors.light.mutedText,
  actions,
  footer,
  style,
}: ScreenHeaderProps) {
  const { top } = useSafeAreaInsets();

  return (
    <>
      <View style={[styles.header, { paddingTop: top + 12 }, style]}>
        <View style={styles.content}>
          <View style={[styles.icon, { backgroundColor: iconBackgroundColor }]}>
            <MaterialCommunityIcons name={iconName as any} size={26} color={iconColor} />
          </View>
          <View style={styles.texts}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: subtitleColor }]}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
});
