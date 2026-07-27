import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebase';
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

  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);

  const firebaseIdToken = await userCredential.user.getIdToken();

  return {
    user: userCredential.user,
    idToken: firebaseIdToken,
  };
}
