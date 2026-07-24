import { useAlertDialog } from '@/components/shared/ui/dialog/AlertDialog';
import { useAuth } from '@/contexts/AuthContext';

import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const { showAlert } = useAlertDialog();
  const { width: screenWidth } = useWindowDimensions();

  const iconSize = Math.min(Math.round(screenWidth * 0.44), 190);
  const titleFontSize = Math.min(Math.round(screenWidth * 0.078), 32);
  const taglineFontSize = Math.min(Math.round(screenWidth * 0.034), 13.5);

  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(buttonScale, {
      toValue: 0.98,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(buttonScale, {
      toValue: 1,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success || result.error) {
        if (result.error?.message !== 'Login cancelado.') {
          showAlert({
            title: 'Erro no Login',
            message: result.error?.message || 'Erro ao entrar com Google.',
            type: 'error',
          });
        }
        return;
      }
    } catch (error) {
      showAlert({
        title: 'Erro Inesperado',
        message: 'Ocorreu um erro ao entrar com Google. Tente novamente.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <LinearGradient
        colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.0)']}
        style={styles.topOverlay}
      />

      <LinearGradient
        colors={['rgba(255,255,255,0.0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.92)']}
        style={styles.bottomOverlay}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.topSpacer} />

          <View style={styles.brandMark}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={{ width: iconSize, height: iconSize }}
              resizeMode="contain"
            />
          </View>

          <View style={styles.midSpacer} />

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.kicker}>BEM-VINDO DE VOLTA</Text>
              <Text style={[styles.appName, { fontSize: titleFontSize }]}>Casa em Dia</Text>
              <Text style={[styles.tagline, { fontSize: taglineFontSize }]}>
                Organize sua casa em família
              </Text>
            </View>

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                onPress={handleGoogleLogin}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={loading}
                activeOpacity={1}
                style={styles.googleButton}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#1A1A1A" />
                ) : (
                  <>
                    <Image
                      source={require('@/assets/images/google.png')}
                      style={styles.googleIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.googleButtonText}>Continuar com Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.footer}>
              Ao continuar, você concorda com os{'\n'}
              <Text style={styles.footerLink} onPress={() => {}}>
                termos de uso
              </Text>
              {' e a '}
              <Text style={styles.footerLink} onPress={() => {}}>
                política de privacidade
              </Text>
              .
            </Text>
          </View>

          <View style={styles.bottomSpacer} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '64%',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  topSpacer: {
    flex: 1.1,
  },
  brandMark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  midSpacer: {
    flex: 0.9,
  },
  bottomSpacer: {
    height: 16,
  },
  panel: {
    width: '100%',
    maxWidth: 420,
  },
  panelHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.mutedText,
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  appName: {
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.6,
  },
  tagline: {
    color: Colors.light.mutedText,
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  googleButton: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.light.cardBackground,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  footer: {
    fontSize: 11.5,
    color: Colors.light.mutedText,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 17,
  },
  footerLink: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
});
