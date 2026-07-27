import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '@/constants/Colors';
import { usePressScale } from '@/hooks/usePressAnimation';

interface Task {
  id: string;
  title: string;
  done: boolean;
  assignee: string;
}

interface TaskListPanelProps {
  tasks: Task[];
  onPressTask?: (taskId: string) => void;
}

function getInitials(name: string) {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function TaskRow({
  task,
  index,
  isLast,
  onPress,
}: {
  task: Task;
  index: number;
  isLast: boolean;
  onPress?: (taskId: string) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-4)).current;
  const { scale, handlePressIn, handlePressOut } = usePressScale({ pressedValue: 0.99 });

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay: index * 35,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 260,
        delay: index * 35,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [index, opacity, translateX]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      disabled={!onPress}
      onPress={() => onPress?.(task.id)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.row,
          !isLast && styles.rowDivider,
          { opacity, transform: [{ translateX }, { scale }] },
        ]}
      >
        <View style={[styles.avatar, task.done && styles.avatarDone]}>
          <Text style={[styles.avatarText, task.done && styles.avatarTextDone]}>
            {getInitials(task.assignee)}
          </Text>
        </View>

        <View style={styles.rowContent}>
          <Text style={[styles.rowTitle, task.done && styles.rowTitleDone]} numberOfLines={1}>
            {task.title}
          </Text>
          <Text style={styles.rowAssignee} numberOfLines={1}>
            {task.assignee}
          </Text>
        </View>

        <View style={[styles.statusTag, task.done && styles.statusTagDone]}>
          <Text style={[styles.statusTagText, task.done && styles.statusTagTextDone]}>
            {task.done ? 'Concluída' : 'Pendente'}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{label}</Text>
    </View>
  );
}

export default function TaskListPanel({ tasks, onPressTask }: TaskListPanelProps) {
  const { pending, completed } = useMemo(() => {
    return {
      pending: tasks.filter((t) => !t.done),
      completed: tasks.filter((t) => t.done),
    };
  }, [tasks]);

  const taskIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    let idx = 0;
    for (const task of pending) {
      map.set(task.id, idx++);
    }
    for (const task of completed) {
      map.set(task.id, idx++);
    }
    return map;
  }, [pending, completed]);

  return (
    <View style={styles.panel}>
      {pending.length > 0 && (
        <>
          <SectionHeader label="Em andamento" />
          <View style={styles.group}>
            {pending.map((task, i) => (
              <TaskRow
                key={task.id}
                task={task}
                index={taskIndexMap.get(task.id) ?? 0}
                isLast={i === pending.length - 1}
                onPress={onPressTask}
              />
            ))}
          </View>
        </>
      )}

      {completed.length > 0 && (
        <>
          <SectionHeader label="Concluídas" />
          <View style={styles.group}>
            {completed.map((task, i) => (
              <TaskRow
                key={task.id}
                task={task}
                index={taskIndexMap.get(task.id) ?? 0}
                isLast={i === completed.length - 1}
                onPress={onPressTask}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingTop: 14,
    paddingBottom: 8,
    paddingHorizontal: 14,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.mutedText,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  group: {
    paddingHorizontal: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: Colors.light.backgroundSecondary,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    marginBottom: 10,
  },
  rowDivider: {
    marginVertical: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    backgroundColor: Colors.light.cardDark,
  },
  avatarDone: {
    backgroundColor: Colors.light.success,
    borderColor: 'transparent',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: 0.2,
  },
  avatarTextDone: {
    color: '#fff',
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  rowTitleDone: {
    textDecorationLine: 'line-through',
    color: Colors.light.mutedText,
    fontWeight: '500',
  },
  rowAssignee: {
    fontSize: 12,
    color: Colors.light.mutedText,
    fontWeight: '500',
  },
  statusTag: {
    borderRadius: 999,
    backgroundColor: Colors.light.cardDark,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  statusTagDone: {
    backgroundColor: 'rgba(22, 163, 74, 0.14)',
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.mutedText,
    letterSpacing: 0.2,
  },
  statusTagTextDone: {
    color: Colors.light.success,
  },
});
