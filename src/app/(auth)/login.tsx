import { useAlertDialog } from '@/components/shared/ui/dialog/AlertDialog';
import { useAuth } from '@/contexts/AuthContext';

import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import {
  ActivityIndicator,
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

  const iconSize = Math.min(Math.round(screenWidth * 0.4), 170);
  const iconBorderRadius = Math.round(iconSize * 0.22);
  const titleFontSize = Math.min(Math.round(screenWidth * 0.09), 40);
  const taglineFontSize = Math.min(Math.round(screenWidth * 0.04), 16);

  const player = useVideoPlayer(require('@/assets/videos/myfamily.mp4'), (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

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
      <StatusBar style="light" />
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" />

      <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.0)']} style={styles.topOverlay} />

      <LinearGradient
        colors={['rgba(0,0,0,0.0)', 'rgba(165, 162, 162, 0.788)', 'rgb(255, 255, 255)']}
        style={styles.bottomOverlay}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.topSection}>
            <View
              style={[
                styles.iconCircle,
                {
                  width: iconSize,
                  height: iconSize,
                  borderRadius: iconBorderRadius,
                },
              ]}
            >
              <Image
                source={require('@/assets/images/icon.png')}
                style={{ width: iconSize - 10, height: iconSize - 10 }}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.appName, { fontSize: titleFontSize }]}>Casa em Dia</Text>
            <Text style={[styles.tagline, { fontSize: taglineFontSize }]}>
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
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <Image
                    source={require('@/assets/images/google.png')}
                    style={styles.googleIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.googleButtonText}>Entrar com Google</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.footer}>
              Ao continuar, você concorda com os{'\n'}termos de uso e política de privacidade.
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
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 24,
  },
  iconCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  appName: {
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 6,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 16,
  },
  googleButton: {
    width: '100%',
    height: 56,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  googleIcon: {
    width: 28,
    height: 28,
  },
  googleButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    fontSize: 12,
    color: 'rgb(5, 5, 5)',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
});
