import type { Task } from '@/types/models';
import { api } from './api';
import { connectSocket } from './socket';

export const subscribeToTasksApi = (familyId: string, callback: (tasks: Task[] | ((prev: Task[]) => Task[])) => void) => {
  const socket = connectSocket('');

  socket.on('connect', () => {
    socket.emit('family:join', { familyId });
  });

  const fetchTasks = async () => {
    try {
      const data = await api.tasks.list(familyId);
      if (data?.tasks) {
        callback(data.tasks);
      }
    } catch (error) {
      console.error('fetchTasks error:', error);
    }
  };

  fetchTasks();

  socket.on('task:created', ({ task }: { task: Task }) => {
    callback((prev: Task[]) => [...prev.filter((t: Task) => t.id !== task.id), task]);
  });

  socket.on('task:updated', ({ task }: { task: Task }) => {
    callback((prev: Task[]) => prev.map((t: Task) => (t.id === task.id ? task : t)));
  });

  socket.on('task:deleted', ({ taskId }: { taskId: string }) => {
    callback((prev: Task[]) => prev.filter((t: Task) => t.id !== taskId));
  });

  socket.on('task:cleared', () => {
    callback([]);
  });

  return () => {
    socket.emit('family:leave', { familyId });
  };
};

export const fetchDashboardTasksApi = async (familyId: string): Promise<Task[]> => {
  const data = await api.tasks.list(familyId);
  return data?.tasks ?? [];
};

export const createTaskApi = async (
  familyId: string,
  payload: { title: string; assigneeId: string; assignee?: string },
  options?: { userName?: string; userId?: string },
) => {
  const data = await api.tasks.create(familyId, { title: payload.title, assigneeId: payload.assigneeId, assigneeName: payload.assignee });
  return data.task;
};

export const toggleTaskCompletionApi = async (input: {
  familyId: string;
  taskId: string;
  task: Task;
  newDone: boolean;
  options?: { userName?: string; userId?: string };
}) => {
  const data = await api.tasks.toggle(input.familyId, input.taskId);
  return data.task;
};

export const deleteTaskApi = async (input: {
  familyId: string;
  taskId: string;
  title?: string;
  options?: { userName?: string; userId?: string };
}) => {
  await api.tasks.delete(input.familyId, input.taskId);
};

export const deleteAllTasksApi = async (input: {
  familyId: string;
  tasks: Task[];
  options?: { userName?: string; userId?: string };
}) => {
  const data = await api.tasks.deleteAll(input.familyId);
  return data.count;
};
