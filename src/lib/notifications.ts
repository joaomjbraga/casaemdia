import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addDays, startOfDay } from '@/lib/date-utils';
import logger from '@/lib/logger';

export interface BillNotificationData {
  billId: string;
  installmentId?: string;
  title: string;
  dueDate: string;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    logger.warn('[notifications] Permission not granted');
    return false;
  }
  return true;
}

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('bill-reminders', {
      name: 'Lembretes de Contas',
      description: 'Notificações de vencimento de contas e parcelas',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'notification',
      vibrationPattern: [0, 250, 250, 250],
      enableLights: true,
      lightColor: '#009394',
    });
  }
}

export async function scheduleBillReminder(
  billId: string,
  installmentId: string | undefined,
  title: string,
  dueDateString: string | Date,
  reminderDays: number[],
): Promise<string[]> {
  const granted = await requestNotificationPermission();
  if (!granted) {
    logger.warn('[notifications] Cannot schedule reminder, permission not granted');
    return [];
  }

  await setupNotificationChannel();

  const dueDate = new Date(dueDateString);
  if (isNaN(dueDate.getTime())) {
    logger.warn('[notifications] Invalid due date', dueDateString);
    return [];
  }

  const identifiers: string[] = [];
  const today = startOfDay(new Date());

  for (const days of reminderDays) {
    const reminderDate = addDays(dueDate, -days);
    reminderDate.setHours(9, 0, 0, 0);

    if (reminderDate < today) continue;

    const identifier = `bill:${billId}:${installmentId ?? billId}:day-${days}`;

    await Notifications.scheduleNotificationAsync(
      {
        content: {
          title: 'Lembrete de conta',
          body: `"${title}" vence ${days === 0 ? 'hoje' : `em ${days} dia${days > 1 ? 's' : ''}`}`,
          data: {
            billId,
            installmentId: installmentId ?? '',
            type: 'bill_reminder',
          },
          sound: 'notification',
        },
        trigger: {
          channelId: Platform.OS === 'android' ? 'bill-reminders' : undefined,
          type: 'date',
          date: reminderDate,
        },
      },
      identifier,
    );

    identifiers.push(identifier);
  }

  logger.info('[notifications] Scheduled reminders', { billId, count: identifiers.length });
  return identifiers;
}

export async function cancelBillNotifications(billId: string): Promise<void> {
  const identifierPrefix = `bill:${billId}:`;
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = all.filter((n) => typeof n.content?.data?.billId === 'string' && n.content.data.billId === billId);

  await Promise.all(
    toCancel.map((n) => {
      if (n.identifier) return Notifications.cancelScheduledNotificationAsync(n.identifier);
      return Promise.resolve();
    }),
  );

  logger.info('[notifications] Cancelled reminders', { billId, count: toCancel.length });
}

export async function cancelAllBillNotifications(): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const billNotifications = all.filter(
    (n) => typeof n.content?.data?.billId === 'string',
  );

  await Promise.all(
    billNotifications.map((n) => {
      if (n.identifier) return Notifications.cancelScheduledNotificationAsync(n.identifier);
      return Promise.resolve();
    }),
  );

  logger.info('[notifications] Cancelled all bill reminders', { count: billNotifications.length });
}

export async function scheduleInstallationNotification(title: string, dueDate: Date): Promise<string | null> {
  const granted = await requestNotificationPermission();
  if (!granted) return null;

  await setupNotificationChannel();

  const today = startOfDay(new Date());
  const reminderDate = new Date(dueDate);
  reminderDate.setHours(9, 0, 0, 0);
  reminderDate.setDate(reminderDate.getDate() - 1);

  if (reminderDate < today) return null;

  const response = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Vencimento de conta',
      body: `"${title}" vence amanhã`,
      data: { type: 'bill_due' },
      sound: 'notification',
    },
    trigger: {
      channelId: Platform.OS === 'android' ? 'bill-reminders' : undefined,
      type: 'date',
      date: reminderDate,
    },
  });

  return response;
}
