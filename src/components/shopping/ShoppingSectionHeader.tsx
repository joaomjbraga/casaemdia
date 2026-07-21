import SectionTitle from "@/components/common/SectionTitle";
import Colors from "@/constants/Colors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface ShoppingSectionHeaderProps {
  label: string;
  count: number;
}

export default function ShoppingSectionHeader({
  label,
  count,
}: ShoppingSectionHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.dot} />
        <SectionTitle
          label={label}
          color={Colors.light.text}
          fontSize={15}
          fontWeight="800"
          letterSpacing={-0.2}
        />
      </View>
      <Text style={styles.count}>{count}</Text>
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  count: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.mutedText,
    backgroundColor: Colors.light.cardDark,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
  },
});
