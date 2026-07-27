import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/Colors';
import ZappIcon from '@/components/common/ZappIcon';

export interface CameraCaptureProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (uri: string) => void;
}

export default function CameraCapture({ visible, onClose, onCapture }: CameraCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) {
      setCapturedUri(null);
    }
  }, [visible]);

  const handleTakePicture = useCallback(async () => {
    try {
      const result = await cameraRef.current?.takePictureAsync({
        quality: 0.85,
        skipProcessing: true,
      });
      if (result?.uri) {
        setCapturedUri(result.uri);
      }
    } catch (error) {
      console.error('Camera capture error:', error);
    }
  }, []);

  const handleSend = useCallback(() => {
    if (capturedUri) {
      onCapture(capturedUri);
      setCapturedUri(null);
      onClose();
    }
  }, [capturedUri, onCapture, onClose]);

  const handleRetake = useCallback(() => {
    setCapturedUri(null);
  }, []);

  const handlePickFromGallery = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      onCapture(result.assets[0].uri);
      onClose();
    }
  }, [onCapture, onClose]);

  if (!visible) return null;

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Carregando câmera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Precisamos de acesso à câmera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Permitir</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onClose}>
          <Text style={styles.buttonText}>Fechar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Modal
    visible={visible}
    transparent
    animationType="slide"
    statusBarTranslucent
    onRequestClose={onClose}
  >
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} mode="picture">
        <View style={[styles.controls, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {capturedUri ? (
            <>
              <TouchableOpacity style={styles.controlButton} onPress={handleRetake}>
                <ZappIcon name="arrow-back" size={22} color="#fff" />
                <Text style={styles.controlLabel}>Refazer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, styles.primaryControl]}
                onPress={handleSend}
              >
                <ZappIcon name="check" size={22} color="#fff" />
                <Text style={styles.controlLabel}>Enviar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
              >
                <ZappIcon name="camera-flip" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.captureButton} onPress={handleTakePicture}>
                <View style={styles.captureInner} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={handlePickFromGallery}>
                <ZappIcon name="image" size={22} color="#fff" />
                <Text style={styles.controlLabel}>Galeria</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </CameraView>
    </View>
  </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: Colors.light.primary,
    marginVertical: 8,
  },
  secondaryButton: {
    backgroundColor: `${Colors.light.primary}44`,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#00000066',
  },
  controlButton: {
    alignItems: 'center',
    gap: 6,
  },
  primaryControl: {
    backgroundColor: `${Colors.light.primary}44`,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  controlLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff22',
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
});
