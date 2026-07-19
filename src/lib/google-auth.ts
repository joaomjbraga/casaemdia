import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebase';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export function configureGoogleSignIn() {
  if (!WEB_CLIENT_ID) {
    console.error("[GoogleAuth] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID não configurada");
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

  if (!idToken) {
    throw new Error('Não foi possível obter o token do Google.');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);

  return userCredential.user;
}
