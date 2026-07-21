import Colors from "@/constants/Colors";
import React from "react";
import { StyleSheet, View } from "react-native";

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  trackColor?: string;
  borderRadius?: number;
}

export default function ProgressBar({
  progress,
  height = 6,
  color = Colors.light.primary,
  trackColor = Colors.light.cardBorder,
  borderRadius,
}: ProgressBarProps) {
  const radius = borderRadius ?? height / 2;
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={[styles.track, { height, borderRadius: radius, backgroundColor: trackColor }]}>
      <View
        style={[
          styles.fill,
          {
            height,
            borderRadius: radius,
            backgroundColor: color,
            width: `${clamped * 100}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: "hidden",
    width: "100%",
  },
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
  },
});
