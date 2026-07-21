import { toast } from "@/lib/toast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import IconCircleButton from "@/components/common/IconCircleButton";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { useFamily } from "@/contexts/FamilyContext";
import { createTask } from "@/services/tasks";

interface AddTaskFormProps {
  onClose: () => void;
  onCreated?: () => void;
}

export default function AddTaskForm({ onClose, onCreated }: AddTaskFormProps) {
  const { user } = useAuth();
  const { familyId } = useFamily();
  const { members } = useFamily();

  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [points, setPoints] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Usuário não autenticado.");
      return;
    }

    if (!familyId) {
      toast.error("Família não encontrada.");
      return;
    }

    if (!title.trim()) {
      toast.error("Digite o título da tarefa.");
      return;
    }

    if (!assigneeId) {
      toast.error("Selecione um responsável.");
      return;
    }

    const pts = parseInt(points);
    if (!pts || pts <= 0) {
      toast.error("Defina uma quantidade de pontos.");
      return;
    }

    const assignee = members.find((m) => m.id === assigneeId);
    if (!assignee) {
      toast.error("Membro não encontrado.");
      return;
    }

    setSubmitting(true);
    try {
      await createTask(
        familyId,
        {
          title: title.trim(),
          assignee: assignee.name,
          assigneeId: assignee.id,
          points: pts,
        },
        {
          userName: user.displayName || user.email?.split("@")[0] || "Alguem",
          userId: user.uid,
        },
      );

      toast.success("Tarefa criada!");
      if (onCreated) {
        onCreated();
      } else {
        onClose();
      }
    } catch (err) {
      toast.error("Não foi possível criar a tarefa.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <IconCircleButton
            iconName="arrow-left"
            onPress={onClose}
            size={40}
            backgroundColor={Colors.light.cardDark}
            borderColor={Colors.light.border}
            iconColor={Colors.light.text}
          />
          <View>
            <Text style={styles.headerTitle}>Nova Tarefa</Text>
            <Text style={styles.headerSubtitle}>
              Crie uma tarefa para alguém
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Título da Tarefa</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Lavar a louça"
              placeholderTextColor={Colors.light.mutedText}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Responsável</Text>
            <View style={styles.membersGrid}>
              {members.length === 0 ? (
                <Text style={styles.noMembers}>Nenhum membro cadastrado</Text>
              ) : (
                members.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.memberChip,
                      assigneeId === member.id && styles.memberChipActive,
                    ]}
                    onPress={() => setAssigneeId(member.id)}
                  >
                    <MaterialCommunityIcons
                      name="account"
                      size={18}
                      color={
                        assigneeId === member.id ? "#fff" : Colors.light.primary
                      }
                    />
                    <Text
                      style={[
                        styles.memberName,
                        assigneeId === member.id && styles.memberNameActive,
                      ]}
                    >
                      {member.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pontos</Text>
            <View style={styles.pointsRow}>
              {[5, 10, 15, 20].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.pointChip,
                    points === p.toString() && styles.pointChipActive,
                  ]}
                  onPress={() => setPoints(p.toString())}
                >
                  <Text
                    style={[
                      styles.pointText,
                      points === p.toString() && styles.pointTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
              <TextInput
                style={[styles.pointsInput, points && styles.pointsInputActive]}
                placeholder="Outro"
                placeholderTextColor={Colors.light.mutedText}
                value={points}
                onChangeText={setPoints}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <MaterialCommunityIcons
              name={submitting ? "loading" : "check"}
              size={22}
              color="#fff"
            />
            <Text style={styles.submitText}>
              {submitting ? "Criando..." : "Criar Tarefa"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingTop: 44,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.mutedText,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 10,
  },
  input: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  membersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  noMembers: {
    fontSize: 14,
    color: Colors.light.mutedText,
    fontStyle: "italic",
  },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    gap: 6,
  },
  memberChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.text,
  },
  memberNameActive: {
    color: Colors.light.text,
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pointChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  pointChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  pointText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  pointTextActive: {
    color: "#fff",
  },
  pointsInput: {
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  pointsInputActive: {
    borderColor: Colors.light.primary,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 18,
    marginTop: 24,
    gap: 10,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.text,
  },
});
