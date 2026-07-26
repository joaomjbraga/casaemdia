import Constants from 'expo-constants';

function resolveEnvVar(key: string): string | undefined {
  const expoExtra = Constants.expoConfig?.extra ?? Constants.manifest?.extra;
  const fromConstants = expoExtra?.[key];
  const fromProcess = process.env[key];

  if (typeof fromConstants === 'string' && fromConstants.length > 0) {
    return fromConstants;
  }

  if (typeof fromProcess === 'string' && fromProcess.length > 0) {
    return fromProcess;
  }

  return undefined;
}

export function getEnv(key: string, fallback?: string): string {
  const value = resolveEnvVar(key);
  if (value !== undefined) {
    return value;
  }
  if (fallback !== undefined) {
    return fallback;
  }
  return '';
}

export function getRequiredEnv(key: string): string {
  const value = resolveEnvVar(key);
  if (!value) {
    throw new Error(`[Env] Missing required environment variable: ${key}`);
  }
  return value;
}

export function getRequiredPublicEnv(key: string): string {
  if (!key.startsWith('EXPO_PUBLIC_')) {
    throw new Error(`[Env] getRequiredPublicEnv should only be used for public Expo variables: ${key}`);
  }
  return getRequiredEnv(key);
}
