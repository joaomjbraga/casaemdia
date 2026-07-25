import { useCallback, useRef } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import logger from '@/lib/logger';

export interface ImageViewerProps {
  visible: boolean;
  uri: string;
  onClose: () => void;
}

const MAX_SCALE = 4;
const MIN_SCALE = 1;

export default function ImageViewer({ visible, uri, onClose }: ImageViewerProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);

  const close = useCallback(() => {
    scale.value = withTiming(1, { duration: 180 });
    savedScale.value = 1;
    translateX.value = withTiming(0, { duration: 180 });
    translateY.value = withTiming(0, { duration: 180 });
    runOnJS(onClose)();
  }, [onClose, scale, savedScale, translateX, translateY]);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      const next = savedScale.value * event.scale;
      scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    })
    .onEnd(() => {
      if (scale.value < MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE, { duration: 150 });
        translateX.value = withTiming(0, { duration: 150 });
        translateY.value = withTiming(0, { duration: 150 });
      }
    });

  const panGesture = Gesture.Pan()
    .minDistance(0)
    .onStart((event) => {
      originX.value = event.x;
      originY.value = event.y;
    })
    .onUpdate((event) => {
      if (scale.value <= MIN_SCALE) return;
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      if (scale.value <= MIN_SCALE) {
        translateX.value = withTiming(0, { duration: 150 });
        translateY.value = withTiming(0, { duration: 150 });
      }
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleImageError = useCallback(() => {
    logger.error('[ImageViewer] image load error', { uri });
  }, [uri]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.backdrop}>
          <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={close} />
          <GestureDetector gesture={composed}>
            <Animated.View style={[styles.imageContainer, animatedStyle]}>
              <Image
                source={{ uri }}
                style={styles.image}
                contentFit="contain"
                onError={handleImageError}
              />
            </Animated.View>
          </GestureDetector>
          <TouchableOpacity style={styles.closeButton} onPress={close} activeOpacity={0.8}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#000000dd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouch: {
    ...StyleSheet.absoluteFill,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 48,
    right: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00000066',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    includeFontPadding: false,
  },
});
