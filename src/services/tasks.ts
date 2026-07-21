import type { Task } from "@/types/models";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { creditCompletion, revertCompletion } from "../lib/gamification";
import { sendNotificationToFamily } from "../lib/onesignal";


export type TaskSnapshot = Task;

export interface TaskMutationOptions {
  userName?: string;
  userId?: string;
}

const buildTasksQuery = (familyId: string) =>
  query(
    collection(db, "families", familyId, "tasks"),
    orderBy("created_at", "desc"),
  );

const mapTaskSnapshot = (d: any): TaskSnapshot => ({
  id: d.id,
  title: d.data().title,
  done: d.data().done,
  assignee: d.data().assignee,
  assigneeId: d.data().assigneeId,
  points: d.data().points,
  createdAt: d.data().created_at,
});

const applyTaskCompletion = async ({
  familyId,
  taskId,
  task,
  newDone,
  options,
}: {
  familyId: string;
  taskId: string;
  task: TaskSnapshot;
  newDone: boolean;
  options?: TaskMutationOptions;
}) => {
  const ref = doc(db, "families", familyId, "tasks", taskId);
  await updateDoc(ref, { done: newDone });

  try {
    if (newDone) {
      await creditCompletion(familyId, task.assigneeId ?? task.assignee, {
        points: task.points,
        task: true,
      });
    } else {
      await revertCompletion(familyId, task.assigneeId ?? task.assignee, {
        points: task.points,
        task: true,
      });
    }
  } catch (error) {
    console.error("Erro ao atualizar gamificação (tarefa):", error);
  }

  if (options?.userName && options.userId) {
    await sendNotificationToFamily({
      familyId,
      excludeUserId: options.userId,
      title: newDone ? "Tarefa concluida" : "Tarefa reaberta",
      body: newDone
        ? `${options.userName} concluiu a tarefa "${task.title}"`
        : `${options.userName} reabriu a tarefa "${task.title}"`,
    });
  }
};

export const subscribeToTasks = (
  familyId: string,
  callback: (tasks: TaskSnapshot[]) => void,
) => {
  return onSnapshot(
    buildTasksQuery(familyId),
    (snapshot) => {
      const data: TaskSnapshot[] = snapshot.docs.map(mapTaskSnapshot);

      callback(data);
    },
    (error) => {
      console.error("Tasks snapshot error:", error);
    },
  );
};

export const fetchDashboardTasks = async (familyId: string) => {
  const snapshot = await getDocs(buildTasksQuery(familyId));

  return snapshot.docs.map(mapTaskSnapshot) satisfies TaskSnapshot[];
};

export const createTask = async (
  familyId: string,
  payload: {
    title: string;
    assignee: string;
    assigneeId: string;
    points: number;
  },
  options?: TaskMutationOptions,
) => {
  const ref = await addDoc(collection(db, "families", familyId, "tasks"), {
    title: payload.title,
    assignee: payload.assignee,
    assigneeId: payload.assigneeId,
    points: payload.points,
    done: false,
    created_at: Timestamp.now(),
  });

  if (options?.userName && options.userId) {
    await sendNotificationToFamily({
      familyId,
      excludeUserId: options.userId,
      title: "Nova tarefa",
      body: `${options.userName} criou a tarefa "${payload.title}" para ${payload.assignee}`,
    });
  }

  return ref.id;
};

export const toggleDashboardTask = async ({
  familyId,
  taskId,
  task,
  options,
}: {
  familyId: string;
  taskId: string;
  task: TaskSnapshot;
  options?: TaskMutationOptions;
}) => {
  const newDone = !task.done;
  await applyTaskCompletion({
    familyId,
    taskId,
    task,
    newDone,
    options,
  });
};

export const toggleTaskCompletion = async ({
  familyId,
  taskId,
  task,
  newDone,
  options,
}: {
  familyId: string;
  taskId: string;
  task: TaskSnapshot;
  newDone: boolean;
  options?: TaskMutationOptions;
}) => {
  await applyTaskCompletion({
    familyId,
    taskId,
    task,
    newDone,
    options,
  });
};

export const deleteDashboardTask = async ({
  familyId,
  taskId,
}: {
  familyId: string;
  taskId: string;
}) => {
  const ref = doc(db, "families", familyId, "tasks", taskId);
  await deleteDoc(ref);
};

export const deleteTask = async ({
  familyId,
  taskId,
  title,
  options,
}: {
  familyId: string;
  taskId: string;
  title?: string;
  options?: TaskMutationOptions;
}) => {
  const ref = doc(db, "families", familyId, "tasks", taskId);
  await deleteDoc(ref);

  if (options?.userName && options.userId) {
    await sendNotificationToFamily({
      familyId,
      excludeUserId: options.userId,
      title: "Tarefa removida",
      body: `${options.userName} removeu a tarefa "${title ?? "tarefa"}"`,
    });
  }
};

export const deleteAllTasks = async ({
  familyId,
  tasks,
  options,
}: {
  familyId: string;
  tasks: TaskSnapshot[];
  options?: TaskMutationOptions;
}) => {
  const batch = writeBatch(db);
  for (const task of tasks) {
    batch.delete(doc(db, "families", familyId, "tasks", task.id));
  }
  await batch.commit();

  if (options?.userName && options.userId) {
    await sendNotificationToFamily({
      familyId,
      excludeUserId: options.userId,
      title: "Tarefas limpas",
      body: `${options.userName} removeu todas as tarefas`,
    });
  }
};
