import { OneSignal, LogLevel, type NotificationClickEvent } from 'react-native-onesignal';
import { getRequiredPublicEnv } from '@/lib/env';
import logger from '@/lib/logger';

const ONESIGNAL_APP_ID = getRequiredPublicEnv('EXPO_PUBLIC_ONESIGNAL_APP_ID');

export function initializeOneSignal(): void {
  if (!ONESIGNAL_APP_ID) {
    logger.error('[OneSignal] App ID nao configurado');
    return;
  }

  OneSignal.Debug.setLogLevel(LogLevel.Warn);
  OneSignal.initialize(ONESIGNAL_APP_ID);

  logger.info('[OneSignal] Inicializado com App ID:', ONESIGNAL_APP_ID.substring(0, 8) + '...');
}

export async function requestPermissionAfterLogin(): Promise<void> {
  try {
    await OneSignal.Notifications.requestPermission(true);
  } catch {
    // non-blocking
  }
}

export function setUserTags(familyId: string, userId: string, email?: string): void {
  const tags: Record<string, string> = { familyId, userId, userEmail: email || '' };
  OneSignal.User.addTags(tags);
  logger.info('[OneSignal] Tags definidas:', { familyId, userId: userId.substring(0, 8) + '...' });
}

export function removeUserTags(): void {
  OneSignal.User.removeTags(['familyId', 'userId', 'userEmail']);
  logger.info('[OneSignal] Tags removidas');
}

let clickHandler: ((event: NotificationClickEvent) => void) | null = null;

export function addNotificationClickListener(
  handler: (data: Record<string, unknown>) => void,
): void {
  removeNotificationClickListener();
  clickHandler = (event: NotificationClickEvent) => {
    const notificationData = event.notification.additionalData;
    logger.info('[OneSignal] Clique na notificacao:', notificationData);
    if (notificationData) {
      handler(notificationData as Record<string, unknown>);
    }
  };
  OneSignal.Notifications.addEventListener('click', clickHandler);
}

export function removeNotificationClickListener(): void {
  if (clickHandler) {
    OneSignal.Notifications.removeEventListener('click', clickHandler);
    clickHandler = null;
  }
}
