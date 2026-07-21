import type { CoupleStat } from "@/types/models";
import Colors from "@/constants/Colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import EmptyState from "@/components/common/EmptyState";
import Avatar from "@/components/common/Avatar";


interface RankingCardProps {
  coupleStats: { [key: string]: CoupleStat };
  currentUserId?: string | null;
}

export default function RankingCard({
  coupleStats,
  currentUserId,
}: RankingCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  // Mapas persistentes por id, para não recriar Animated.Value a cada render
  const scaleAnimsRef = useRef<Map<string, Animated.Value>>(new Map());
  const progressAnimsRef = useRef<Map<string, Animated.Value>>(new Map());

  const sortedStats = Object.values(coupleStats).sort(
    (a, b) => b.points - a.points,
  );
  const maxPoints = Math.max(...sortedStats.map((stat) => stat.points), 1);

  // Posição do usuário logado no ranking (1-based).
  const currentUserPosition =
    currentUserId != null
      ? sortedStats.findIndex((s) => s.id === currentUserId) + 1
      : null;

  const getScaleAnim = (name: string) => {
    if (!scaleAnimsRef.current.has(name)) {
      scaleAnimsRef.current.set(name, new Animated.Value(1));
    }
    return scaleAnimsRef.current.get(name)!;
  };

  const getProgressAnim = (name: string) => {
    if (!progressAnimsRef.current.has(name)) {
      progressAnimsRef.current.set(name, new Animated.Value(0));
    }
    return progressAnimsRef.current.get(name)!;
  };

  useEffect(() => {
    const progressAnims = sortedStats.map((stat) => getProgressAnim(stat.name));

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      ...progressAnims.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 1200,
          delay: index * 200,
          useNativeDriver: false,
        }),
      ),
    ]).start();

    return () => {
      progressAnims.forEach((anim) => anim.stopAnimation());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(sortedStats.map((s) => [s.name, s.points]))]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <RankingHeader
        total={sortedStats.reduce((s, s2) => s + s2.tasksCompleted, 0)}
        currentPosition={currentUserPosition}
      />

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {sortedStats.length === 0 ? (
          <RankingEmptyState />
        ) : (
          sortedStats
            .slice(0, 5)
            .map((stat, index) => (
              <RankingItem
                key={stat.id}
                stat={stat}
                index={index}
                maxPoints={maxPoints}
                isCurrentUser={stat.id === currentUserId}
                scaleAnim={getScaleAnim(stat.id)}
                progressAnim={getProgressAnim(stat.id)}
              />
            ))
        )}
      </ScrollView>

      {sortedStats.length > 0 && <RankingFooter />}
    </Animated.View>
  );
}

const getIcon = (position: number) => {
  switch (position) {
    case 0:
      return "crown";
    case 1:
      return "medal";
    case 2:
      return "trophy-variant";
    default:
      return "account-circle-outline";
  }
};

const getRankColor = (position: number) => {
  switch (position) {
    case 0:
      return "#FFD700";
    case 1:
      return "#C0C0C8";
    case 2:
      return "#CD7F32";
    default:
      return Colors.light.mutedText;
  }
};

const getRankBgColor = (position: number) => {
  switch (position) {
    case 0:
      return "rgba(255, 215, 0, 0.15)";
    case 1:
      return "rgba(192, 192, 200, 0.15)";
    case 2:
      return "rgba(205, 127, 50, 0.15)";
    default:
      return "transparent";
  }
};

function RankingHeader({
  total,
  currentPosition,
}: {
  total: number;
  currentPosition: number | null;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerIcon}>
        <MaterialCommunityIcons
          name="trophy"
          size={20}
          color={Colors.light.iconPrimary}
        />
      </View>
      <View style={styles.headerContent}>
        <Text style={styles.title}>Ranking Familiar</Text>
        <Text style={styles.subtitle}>
          {currentPosition != null && currentPosition > 0
            ? `Você está em ${currentPosition}º lugar`
            : "Liderança atual"}
        </Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{total}</Text>
        <Text style={styles.badgeLabel}>tarefas</Text>
      </View>
    </View>
  );
}

function RankingItem({
  stat,
  index,
  maxPoints,
  isCurrentUser,
  scaleAnim,
  progressAnim,
}: {
  stat: CoupleStat;
  index: number;
  maxPoints: number;
  isCurrentUser?: boolean;
  scaleAnim: Animated.Value;
  progressAnim: Animated.Value;
}) {
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", `${(stat.points / maxPoints) * 100}%`],
    extrapolate: "clamp",
  });

  const rankColor = getRankColor(index);
  const rankBgColor = getRankBgColor(index);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={styles.item}
    >
      <Animated.View
        style={[
          styles.itemContainer,
          isCurrentUser && styles.itemContainerCurrent,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View
          style={[
            styles.itemContent,
            isCurrentUser && styles.itemContentCurrent,
            { borderLeftColor: rankColor },
          ]}
        >
          <View style={styles.rankSection}>
            <View style={[styles.rankIcon, { backgroundColor: rankBgColor }]}>
              <MaterialCommunityIcons
                name={getIcon(index)}
                size={14}
                color={rankColor}
              />
            </View>
            <Text style={[styles.rankText, { color: rankColor }]}>
              {index + 1}º
            </Text>
          </View>

          <View style={styles.userSection}>
            <Avatar
              photoURL={stat.photoURL}
              size={34}
              borderRadius={17}
              iconSet="ion"
              iconName={stat.avatar}
              iconColor={Colors.light.iconPrimary}
              iconSize={18}
            />
            <View style={styles.userInfo}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {stat.name}
                </Text>
                {isCurrentUser && (
                  <View style={styles.youBadge}>
                    <Text style={styles.youBadgeText}>Você</Text>
                  </View>
                )}
              </View>
              <View style={styles.statsRow}>
                <Text style={[styles.userStats, { color: rankColor }]}>
                  {stat.points} pts
                </Text>
                <Text style={styles.userStats}>
                  {" "}
                  • {stat.tasksCompleted} tarefas
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.progress}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { backgroundColor: rankColor, width: progressWidth },
                ]}
              />
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

function RankingEmptyState() {
  return (
    <EmptyState
      iconName="trophy-broken"
      title="Nenhum registro ainda"
      subtitle="Complete tarefas para aparecer no ranking"
    />
  );
}

function RankingFooter() {
  return (
    <View style={styles.footer}>
      <MaterialCommunityIcons
        name="star-circle"
        size={12}
        color={Colors.light.mutedText}
      />
      <Text style={styles.footerText}>
        Continue completando tarefas para subir no ranking
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.cardDark,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.light.mutedText,
    marginTop: 2,
  },
  badge: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
    backgroundColor: Colors.light.cardDark,
    minWidth: 48,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.text,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: Colors.light.mutedText,
    marginTop: 1,
  },
  list: {
    flex: 1,
    maxHeight: 240,
  },
  listContent: {
    gap: 8,
    paddingBottom: 4,
  },
  item: {
    borderRadius: 10,
  },
  itemContainer: {
    borderRadius: 10,
  },
  itemContainerCurrent: {
    borderRadius: 10,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.cardDark,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderLeftWidth: 3,
    borderRadius: 10,
  },
  itemContentCurrent: {
    backgroundColor: Colors.light.accentPurpleSurface,
    borderColor: "rgba(175, 82, 222, 0.25)",
  },
  rankSection: {
    alignItems: "center",
    marginRight: 10,
    minWidth: 30,
  },
  rankIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 3,
    borderWidth: 1,
  },
  rankText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  userSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
    letterSpacing: -0.1,
  },
  youBadge: {
    backgroundColor: Colors.light.accentPurpleSurface,
    borderWidth: 1,
    borderColor: "rgba(175, 82, 222, 0.25)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.light.accentPurple,
    letterSpacing: 0.2,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  userStats: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.light.mutedText,
  },
  progress: {
    alignItems: "flex-end",
    width: 48,
  },
  progressBar: {
    width: 48,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: Colors.light.progressBackground,
    marginBottom: 0,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginTop: 8,
  },
  footerText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.light.mutedText,
    textAlign: "center",
  },
});
