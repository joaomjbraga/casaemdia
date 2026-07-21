import { OneSignal, LogLevel, type NotificationClickEvent } from 'react-native-onesignal';
import logger from '@/lib/logger';

const ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || '';
const ONESIGNAL_REST_API_KEY = process.env.EXPO_PUBLIC_ONESIGNAL_REST_API_KEY || '';
const ONESIGNAL_API_URL = 'https://api.onesignal.com/notifications';

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

export async function checkPushPermission(): Promise<boolean> {
  try {
    const permission = await OneSignal.Notifications.getPermissionAsync();
    if (!permission) {
      logger.warn('[OneSignal] Push permission denied - usuario sem chip ou permissao negada');
    }
    return permission;
  } catch {
    return false;
  }
}

export async function requestPushPermission(): Promise<boolean> {
  try {
    return await OneSignal.Notifications.requestPermission(true);
  } catch {
    return false;
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

export async function sendNotificationToFamily(params: {
  familyId: string;
  excludeUserId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<boolean> {
  const { familyId, excludeUserId, title, body, data } = params;

  if (!ONESIGNAL_REST_API_KEY || ONESIGNAL_REST_API_KEY.includes('COLE')) {
    logger.warn('[OneSignal] REST API Key nao configurada');
    return false;
  }
  if (!ONESIGNAL_APP_ID) {
    logger.warn('[OneSignal] App ID nao configurado');
    return false;
  }

  try {
    const response = await fetch(ONESIGNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        target_channel: 'push',
        headings: { en: title, pt: title },
        contents: { en: body, pt: body },
        data: data || {},
        android_sound: 'notification',
        filters: [
          { field: 'tag', key: 'familyId', relation: '=', value: familyId },
          { field: 'tag', key: 'userId', relation: '!=', value: excludeUserId },
        ],
      }),
    });

    const result = await response.json();

    if (response.ok) {
      const recipients = result.recipients ?? result.android_recipients;
      if (!recipients || recipients === 0) {
        logger.info(
          '[OneSignal] Notificacao sem destinatarios (provavelmente usuario unico na familia)',
        );
      } else {
        logger.info('[OneSignal] Notificacao enviada:', result.id, '| recipients:', recipients);
      }
      return true;
    }

    logger.error('[OneSignal] Erro na API:', result);
    return false;
  } catch (error) {
    logger.error('[OneSignal] Erro ao enviar notificacao:', error);
    return false;
  }
}

export async function sendNotificationToEmail(params: {
  email: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<boolean> {
  const { email, title, body, data } = params;

  if (!ONESIGNAL_REST_API_KEY || ONESIGNAL_REST_API_KEY.includes('COLE')) {
    logger.warn('[OneSignal] REST API Key nao configurada');
    return false;
  }
  if (!ONESIGNAL_APP_ID) {
    logger.warn('[OneSignal] App ID nao configurado');
    return false;
  }

  try {
    const response = await fetch(ONESIGNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        target_channel: 'push',
        headings: { en: title, pt: title },
        contents: { en: body, pt: body },
        data: data || {},
        android_sound: 'notification',
        filters: [{ field: 'tag', key: 'userEmail', relation: '=', value: email.toLowerCase() }],
      }),
    });

    const result = await response.json();

    if (response.ok) {
      const recipients = result.recipients ?? result.android_recipients;
      logger.info(
        '[OneSignal] Notificacao enviada para email:',
        email.substring(0, 5),
        '***',
        '| recipients:',
        recipients ?? 0,
      );
      return true;
    }

    logger.error('[OneSignal] Erro na API (email):', result);
    return false;
  } catch (error) {
    logger.error('[OneSignal] Erro ao enviar notificacao (email):', error);
    return false;
  }
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
