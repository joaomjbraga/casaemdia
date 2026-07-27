import { useAlertDialog } from '@/components/shared/ui/dialog/AlertDialog';
import { useAuth } from '@/contexts/AuthContext';
import { usePressScale } from '@/hooks/usePressAnimation';

import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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

  const iconSize = Math.min(Math.round(screenWidth * 0.42), 168);
  const { scale, handlePressIn, handlePressOut } = usePressScale({ pressedValue: 0.98 });

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
    } catch {
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

      <LinearGradient colors={['#E9FAFB', '#F8FBFF']} style={styles.backgroundGradient} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.hero}>
            <View style={styles.brandCircle}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={{ width: iconSize, height: iconSize }}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Casa em Dia</Text>
            <Text style={styles.subtitle}>
              Rotina da família mais simples, com tarefas e compras sempre visíveis.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Entre com Google</Text>
            <Text style={styles.cardDescription}>
              Use sua conta para entrar na casa, sincronizar membros e manter tudo em dia.
            </Text>

            <Animated.View style={{ transform: [{ scale }] }}>
              <TouchableOpacity
                onPress={handleGoogleLogin}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={loading}
                activeOpacity={1}
                style={[styles.googleButton, loading && styles.googleButtonDisabled]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.light.textWhite} />
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

            <View style={styles.featuresRow}>
              <View style={styles.featureChip}>
                <Text style={styles.featureText}>Tarefas claras</Text>
              </View>
              <View style={styles.featureChip}>
                <Text style={styles.featureText}>Compras organizadas</Text>
              </View>
              <View style={styles.featureChip}>
                <Text style={styles.featureText}>Chat familiar</Text>
              </View>
            </View>
          </View>

          <Text style={styles.footer}>
            Ao continuar, você concorda com nossos{' '}
            <Text style={styles.footerLink} onPress={() => {}}>
              termos de uso
            </Text>
            {' e '}
            <Text style={styles.footerLink} onPress={() => {}}>
              política de privacidade
            </Text>
            .
          </Text>
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
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 12,
  },
  brandCircle: {
    width: 116,
    height: 116,
    borderRadius: 32,
    backgroundColor: Colors.light.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  title: {
    marginTop: 22,
    fontSize: 34,
    fontWeight: '800',
    color: Colors.light.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    color: Colors.light.mutedText,
    textAlign: 'center',
    maxWidth: 330,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 10,
    letterSpacing: -0.4,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.light.mutedText,
    marginBottom: 22,
  },
  googleButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#005B5B',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    color: Colors.light.textWhite,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  featuresRow: {
    marginTop: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  featureChip: {
    flexBasis: '48%',
    backgroundColor: Colors.light.cardDark,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  featureText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.light.secondary,
    lineHeight: 18,
  },
  footer: {
    fontSize: 11.5,
    color: Colors.light.mutedText,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  footerLink: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
});
