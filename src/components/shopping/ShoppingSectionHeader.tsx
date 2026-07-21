import SectionTitle from "@/components/common/SectionTitle";
import Colors from "@/constants/Colors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface ShoppingSectionHeaderProps {
  label: string;
  count: number;
  totalPoints?: number;
  done?: boolean;
}

export default function ShoppingSectionHeader({
  label,
  count,
  totalPoints = 0,
  done = false,
}: ShoppingSectionHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={[styles.dot, done && styles.dotDone]} />
        <SectionTitle
          label={label}
          color={done ? Colors.light.success : Colors.light.text}
          fontSize={15}
          fontWeight="800"
          letterSpacing={-0.2}
          uppercase={false}
        />
      </View>
      <View style={styles.badges}>
        <View style={[styles.count, done && styles.countDone]}>
          <Text style={[styles.countText, done && styles.countTextDone]}>{count}</Text>
        </View>
        {totalPoints > 0 && (
          <View style={[styles.xpBadge, done && styles.xpBadgeDone]}>
            <Text style={[styles.xpText, done && styles.xpTextDone]}>
              {totalPoints} XP
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
  dotDone: {
    backgroundColor: Colors.light.success,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  count: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.mutedText,
    backgroundColor: Colors.light.cardDark,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
  },
  countDone: {
    backgroundColor: "rgba(88, 204, 2, 0.12)",
  },
  countText: {
    color: Colors.light.mutedText,
  },
  countTextDone: {
    color: Colors.light.success,
  },
  xpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: Colors.light.accentPurpleSurface,
  },
  xpBadgeDone: {
    backgroundColor: "rgba(88, 204, 2, 0.12)",
  },
  xpText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.accentPurple,
    letterSpacing: 0.2,
  },
  xpTextDone: {
    color: Colors.light.success,
  },
});
