import { AlertDialogProvider, useAlertDialog } from "@/components/shared/ui/dialog/AlertDialog";
import { ConfirmDialogProvider } from "@/components/shared/ui/dialog/ConfirmDialog";
import { ToastProviderWithViewport } from "@/components/shared/ui/toast";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { FamilyProvider } from "@/contexts/FamilyContext";
import { InvitationProvider } from "@/contexts/InvitationContext";
import { initializeOneSignal, setUserTags, removeUserTags, addNotificationClickListener, removeNotificationClickListener, checkPushPermission, requestPushPermission } from "@/lib/onesignal";
import { useFamily } from "@/contexts/FamilyContext";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { NavigationBar } from "expo-navigation-bar";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Text, View, Linking } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Colors from "../constants/Colors";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

(Text as any).defaultProps = {
  ...(Text as any).defaultProps,
  style: { fontFamily: "SpaceMono" },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
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
    if (Platform.OS === "android") {
      NavigationBar.setStyle("dark");
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
  const { user, initialized } = useAuth();

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isAuthenticated = user && user.email;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, initialized, segments]);
}

function RootLayoutNav() {
  const { user, loading, initialized } = useAuth();
  const { familyId, wasRemoved, acknowledgeRemoval } = useFamily();
  const { showAlert } = useAlertDialog();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const pushWarningShown = useRef(false);

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
    if (!initialized || loading || pushWarningShown.current) return;

    const timer = setTimeout(async () => {
      const hasPermission = await checkPushPermission();
      if (!hasPermission && !pushWarningShown.current) {
        pushWarningShown.current = true;
        showAlert({
          title: "Notificações desativadas",
          message:
            "Seu dispositivo não possui chip ou as notificações foram negadas. " +
            "Você não receberá alertas de tarefas e compras. " +
            "Para ativar, insira um chip e reabra o app.",
          type: "error",
          buttonText: "Entendi",
        });
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [initialized, loading, showAlert]);

  useEffect(() => {
    if (!wasRemoved) return;
    showAlert({
      title: "Você saiu da família",
      message:
        "Você foi removido da família. Criamos uma nova família para você " +
        "para que possa continuar usando o app normalmente.",
      type: "info",
      buttonText: "Entendi",
    });
    acknowledgeRemoval();
  }, [wasRemoved, showAlert, acknowledgeRemoval]);

  useEffect(() => {
    addNotificationClickListener((data) => {
      const type = data?.type;
      if (type === "new_task" || type === "task_completed") {
        router.push("/(tabs)/tasks");
      } else if (type === "shopping_added" || type === "shopping_completed") {
        router.push("/(tabs)/shoppinglist");
      }
    });
    return () => removeNotificationClickListener();
  }, []);

  useEffect(() => {
    if (user && familyId) {
      setUserTags(familyId, user.uid, user.email || undefined);
    } else {
      removeUserTags();
    }
  }, [user, familyId]);

  if (!initialized || loading || isInitialLoad) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: Colors.light.background,
          }}
        >
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text
            style={{
              marginTop: 16,
              fontSize: 16,
              fontWeight: "500",
              color: Colors.light.mutedText,
            }}
          >
            Carregando...
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
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
            presentation: "modal",
          }}
        />

        <Stack.Screen
          name="AddTaskScreen"
          options={{
            headerShown: false,
            gestureEnabled: true,
            presentation: "modal",
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
