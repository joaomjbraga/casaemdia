import type { Task } from '@/types/models';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import logger from '@/lib/logger';
import { creditCompletion, revertCompletion } from '../lib/gamification';
import { sendNotificationToFamily } from '../lib/onesignal';

const BATCH_LIMIT = 500;

export type TaskSnapshot = Task;

export interface TaskMutationOptions {
  userName?: string;
  userId?: string;
}

const buildTasksQuery = (familyId: string) =>
  query(collection(db, 'families', familyId, 'tasks'), orderBy('created_at', 'desc'));

const mapTaskSnapshot = (d: any): TaskSnapshot => {
  const data = d.data();
  return {
    id: d.id,
    title: data.title,
    done: data.done,
    assignee: data.assignee,
    assigneeId: data.assigneeId,
    points: data.points,
    createdAt: data.created_at,
  };
};

const commitBatched = async (
  ops: { type: 'delete' | 'update' | 'set'; ref: any; data?: any }[],
) => {
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const chunk = ops.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(db);
    for (const op of chunk) {
      if (op.type === 'delete') batch.delete(op.ref);
      else if (op.type === 'update') batch.update(op.ref, op.data);
      else if (op.type === 'set') batch.set(op.ref, op.data);
    }
    await batch.commit();
  }
};

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
  const ref = doc(db, 'families', familyId, 'tasks', taskId);

  const stateChanged = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) return false;

    const currentDone = snap.data().done;
    if (currentDone === newDone) return false;

    transaction.update(ref, { done: newDone });
    return true;
  });

  if (!stateChanged) return;

  const assigneeId = task.assigneeId || task.assignee;
  if (!assigneeId) return;

  try {
    if (newDone) {
      await creditCompletion(familyId, assigneeId, {
        points: task.points,
        task: true,
      });
    } else {
      await revertCompletion(familyId, assigneeId, {
        points: task.points,
        task: true,
      });
    }
  } catch (error) {
    logger.error('Erro ao atualizar gamificação (tarefa):', error);
  }

  if (options?.userName && options.userId) {
    try {
      await sendNotificationToFamily({
        familyId,
        excludeUserId: options.userId,
        title: newDone ? 'Tarefa concluida' : 'Tarefa reaberta',
        body: newDone
          ? `${options.userName} concluiu a tarefa "${task.title}"`
          : `${options.userName} reabriu a tarefa "${task.title}"`,
      });
    } catch (error) {
      logger.error('Erro ao enviar notificação (tarefa):', error);
    }
  }
};

export const subscribeToTasks = (familyId: string, callback: (tasks: TaskSnapshot[]) => void) => {
  return onSnapshot(
    buildTasksQuery(familyId),
    (snapshot) => {
      const data: TaskSnapshot[] = snapshot.docs.map(mapTaskSnapshot);
      callback(data);
    },
    (error) => {
      logger.error('Tasks snapshot error:', error);
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
  const ref = await addDoc(collection(db, 'families', familyId, 'tasks'), {
    title: payload.title,
    assignee: payload.assignee,
    assigneeId: payload.assigneeId,
    points: payload.points,
    done: false,
    created_at: Timestamp.now(),
  });

  if (options?.userName && options.userId) {
    try {
      await sendNotificationToFamily({
        familyId,
        excludeUserId: options.userId,
        title: 'Nova tarefa',
        body: `${options.userName} criou a tarefa "${payload.title}" para ${payload.assignee}`,
      });
    } catch (error) {
      logger.error('Erro ao enviar notificação (nova tarefa):', error);
    }
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
  await applyTaskCompletion({
    familyId,
    taskId,
    task,
    newDone: !task.done,
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
  const ref = doc(db, 'families', familyId, 'tasks', taskId);
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
  const ref = doc(db, 'families', familyId, 'tasks', taskId);
  await deleteDoc(ref);

  if (options?.userName && options.userId) {
    try {
      await sendNotificationToFamily({
        familyId,
        excludeUserId: options.userId,
        title: 'Tarefa removida',
        body: `${options.userName} removeu a tarefa "${title ?? 'tarefa'}"`,
      });
    } catch (error) {
      logger.error('Erro ao enviar notificação (remover tarefa):', error);
    }
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
  const ops = tasks.map((task) => ({
    type: 'delete' as const,
    ref: doc(db, 'families', familyId, 'tasks', task.id),
  }));
  await commitBatched(ops);

  if (options?.userName && options.userId) {
    try {
      await sendNotificationToFamily({
        familyId,
        excludeUserId: options.userId,
        title: 'Tarefas limpas',
        body: `${options.userName} removeu todas as tarefas`,
      });
    } catch (error) {
      logger.error('Erro ao enviar notificação (limpar tarefas):', error);
    }
  }
};
