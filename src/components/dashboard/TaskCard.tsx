import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/Colors";

interface DashboardTaskCardProps {
  title: string;
  done: boolean;
  assignee: string;
  points: number;
}

export default function DashboardTaskCard({
  title,
  done,
  assignee,
  points,
}: DashboardTaskCardProps) {
  return (
    <View style={[styles.card, done && styles.cardDone]}>
      <View style={styles.readOnlyIndicator} />

      <View style={styles.content}>
        <Text
          style={[styles.title, done && styles.titleDone]}
          numberOfLines={2}
        >
          {title}
        </Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons
              name="account-outline"
              size={14}
              color={Colors.light.mutedText}
            />
            <Text style={styles.metaText}>{assignee}</Text>
          </View>

          <View style={styles.metaItem}>
            <MaterialCommunityIcons
              name="star"
              size={14}
              color={Colors.light.primary}
            />
            <Text style={[styles.metaText, { color: Colors.light.primary }]}>
              {points}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  cardDone: {
    borderLeftColor: Colors.light.success,
    opacity: 0.6,
  },
  readOnlyIndicator: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.light.border,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 7,
    lineHeight: 20,
  },
  titleDone: {
    textDecorationLine: "line-through",
    color: Colors.light.mutedText,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.mutedText,
    fontWeight: "500",
  },
});
