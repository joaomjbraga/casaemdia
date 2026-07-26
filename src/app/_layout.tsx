import { AlertDialogProvider, useAlertDialog } from '@/components/shared/ui/dialog/AlertDialog';
import { ConfirmDialogProvider } from '@/components/shared/ui/dialog/ConfirmDialog';
import { ToastProviderWithViewport } from '@/components/shared/ui/toast';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { FamilyProvider, useFamily } from '@/contexts/FamilyContext';
import { InvitationProvider } from '@/contexts/InvitationContext';
import {
  initializeOneSignal,
  setUserTags,
  removeUserTags,
  addNotificationClickListener,
  removeNotificationClickListener,
  requestPermissionAfterLogin,
} from '@/lib/onesignal';
import { useFonts } from 'expo-font';
import { NavigationBar } from 'expo-navigation-bar';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View, Linking } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

(Text as any).defaultProps = {
  ...(Text as any).defaultProps,
  style: { fontFamily: 'SpaceMono' },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setStyle('dark');
    }
    initializeOneSignal();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <FamilyProvider>
        <InvitationProvider>
          <AlertDialogProvider>
            <ConfirmDialogProvider>
              <ToastProviderWithViewport>
                <RootLayoutNav />
              </ToastProviderWithViewport>
            </ConfirmDialogProvider>
          </AlertDialogProvider>
        </InvitationProvider>
      </FamilyProvider>
    </AuthProvider>
  );
}

function useProtectedRoute() {
  const segments = useSegments();
  const { user, initialized, isTokenReady } = useAuth();

  useEffect(() => {
    if (!initialized) return;
    if (!segments) return;

    const firstSegment = Array.isArray(segments) ? segments[0] : undefined;
    if (!firstSegment) return;

    const inAuthGroup = firstSegment === '(auth)';
    const isAuthenticated = Boolean(user && user.email && isTokenReady);

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, initialized, isTokenReady, segments]);
}

function RootLayoutNav() {
  const { user, loading, initialized } = useAuth();
  const { familyId, wasRemoved, acknowledgeRemoval } = useFamily();
  const { showAlert } = useAlertDialog();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useProtectedRoute();

  useEffect(() => {
    if (initialized && !loading) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [initialized, loading]);

  useEffect(() => {
    if (!wasRemoved) return;
    showAlert({
      title: 'Você saiu da família',
      message:
        'Você foi removido da família. Criamos uma nova família para você ' +
        'para que possa continuar usando o app normalmente.',
      type: 'info',
      buttonText: 'Entendi',
    });
    acknowledgeRemoval();
  }, [wasRemoved, showAlert, acknowledgeRemoval]);

  useEffect(() => {
    addNotificationClickListener((data) => {
      const type = data?.type;
      if (type === 'new_task' || type === 'task_completed') {
        router.push('/(tabs)/tasks');
      } else if (type === 'shopping_added' || type === 'shopping_completed') {
        router.push('/(tabs)/shoppinglist');
      }
    });
    return () => removeNotificationClickListener();
  }, []);

  useEffect(() => {
    if (user && familyId) {
      setUserTags(familyId, user.uid, user.email || undefined);
      requestPermissionAfterLogin();
    } else {
      removeUserTags();
    }
  }, [user, familyId]);

  if (!initialized || loading || isInitialLoad) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loaderText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />

        <Stack.Screen
          name="(auth)/login"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />

        <Stack.Screen
          name="_settings"
          options={{
            headerShown: false,
            gestureEnabled: true,
            presentation: 'modal',
          }}
        />

        <Stack.Screen
          name="AddTaskScreen"
          options={{
            headerShown: false,
            gestureEnabled: true,
            presentation: 'modal',
          }}
        />

        <Stack.Screen
          name="task-detail"
          options={{
            headerShown: false,
            gestureEnabled: true,
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.mutedText,
  },
});
