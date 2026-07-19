import { useAlertDialog } from "@/components/shared/ui/dialog/AlertDialog";
import LoginBackground from "@/components/templates/login-background";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";

import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const { showAlert } = useAlertDialog();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success || result.error) {
        if (result.error?.message !== "Login cancelado.") {
          showAlert({
            title: "Erro no Login",
            message: result.error?.message || "Erro ao entrar com Google.",
            type: "error",
          });
        }
        return;
      }
    } catch (error) {
      showAlert({
        title: "Erro Inesperado",
        message: "Ocorreu um erro ao entrar com Google. Tente novamente.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LoginBackground />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.topSection}>
            <View style={styles.iconCircle}>
              <Image
                source={require("@/assets/images/icon.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>Casa em Dia</Text>
            <Text style={styles.tagline}>
              Organize sua casa em família
            </Text>
          </View>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={loading}
              activeOpacity={0.8}
              style={styles.googleButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.light.text} />
              ) : (
                <>
                  <Image
                    source={require("@/assets/images/google.png")}
                    style={styles.googleIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.googleButtonText}>
                    Entrar com Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.footer}>
              Ao continuar, você concorda com os{"\n"}termos de uso e política
              de privacidade.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  topSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 200,
    height: 200,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  logoImage: {
    width: 170,
    height: 170,
  },
  appName: {
    fontSize: 34,
    fontWeight: "800",
    color: Colors.light.text,
    letterSpacing: -0.6,
  },
  tagline: {
    fontSize: 15,
    color: Colors.light.mutedText,
    marginTop: 6,
    fontWeight: "500",
  },
  bottomSection: {
    width: "100%",
    alignItems: "center",
  },
  googleButton: {
    width: "100%",
    height: 54,
    borderRadius: 18,
    backgroundColor: Colors.light.cardDark,
    borderWidth: 1,
    borderColor: Colors.light.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleIcon: {
    width: 28,
    height: 28,
  },
  googleButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    fontSize: 12,
    color: Colors.light.mutedText,
    textAlign: "center",
    marginTop: 28,
    lineHeight: 18,
  },
});
