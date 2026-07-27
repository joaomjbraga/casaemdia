import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getRequiredPublicEnv } from '@/lib/env';
import logger from '@/lib/logger';

const WEB_CLIENT_ID = getRequiredPublicEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');

export function configureGoogleSignIn() {
  if (!WEB_CLIENT_ID) {
    logger.error('[GoogleAuth] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID não configurada');
    return;
  }

  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: true,
  });
}

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  try {
    await GoogleSignin.signOut();
  } catch {}

  const userInfo = await GoogleSignin.signIn();

  const idToken = userInfo.data?.idToken;

  if (!idToken || !idToken.includes('.')) {
    const tokens = {
      idToken: userInfo.data?.idToken,
      serverAuthCode: userInfo.data?.serverAuthCode,
    };
    logger.error('[GoogleAuth] idToken ausente ou inválido', tokens);
    throw new Error('Não foi possível obter o token do Google.');
  }

  return {
    user: {
      uid: userInfo.data?.user.id ?? '',
      email: userInfo.data?.user.email ?? '',
      displayName: userInfo.data?.user.name ?? userInfo.data?.user.email?.split('@')[0] ?? 'Usuário',
      photoURL: userInfo.data?.user.photo ?? null,
    },
    idToken,
  };
}