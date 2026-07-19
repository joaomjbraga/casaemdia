// Complemento de tipos para o Firebase Auth em React Native.
//
// `getReactNativePersistence` existe em tempo de execução no bundle React Native
// do Firebase (firebase/auth resolve para dist/rn), mas não é declarado nos
// typings padrão (voltados para a Web). Esta declaração adiciona a assinatura
// para que o TypeScript reconheça o import usado em `lib/firebase.ts`.
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
