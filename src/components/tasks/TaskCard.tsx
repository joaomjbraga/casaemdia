import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Colors from "../../constants/Colors";

interface TaskCardProps {
  title: string;
  done: boolean;
  assignee: string;
  points: number;
  onToggle: () => void;
  onDelete: () => void;
  isLoading?: boolean;
}

export default function TaskCard({
  title,
  done,
  assignee,
  points,
  onToggle,
  onDelete,
  isLoading,
}: TaskCardProps) {
  return (
    <View style={[styles.card, done && styles.cardDone]}>
      <TouchableOpacity
        style={[styles.checkbox, done && styles.checkboxDone]}
        onPress={onToggle}
        disabled={isLoading}
      >
        {done && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
      </TouchableOpacity>

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

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={onDelete}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons
          name="close"
          size={16}
          color={Colors.light.mutedText}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  cardDone: {
    borderLeftColor: Colors.light.success,
    opacity: 0.55,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.25)",
    marginRight: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  checkboxDone: {
    backgroundColor: Colors.light.success,
    borderColor: Colors.light.success,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 7,
    lineHeight: 20,
  },
  titleDone: {
    textDecorationLine: "line-through",
    color: "rgba(255, 255, 255, 0.45)",
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
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "500",
  },
  deleteBtn: {
    padding: 4,
    marginLeft: 4,
    opacity: 0.6,
  },
});
