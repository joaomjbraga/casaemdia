import Colors from '@/constants/Colors';
import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ZappIcon from '@/components/common/ZappIcon';

  interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  bottomInset?: number;
  onPickImage?: () => void;
  onPickAudio?: () => void;
  onStartAudioRecording?: () => void;
  onStopAudioRecording?: () => void;
  onPickCamera?: () => void;
  uploading?: boolean;
  isRecordingAudio?: boolean;
}

export default function ChatInput({
  onSend,
  disabled,
  bottomInset = 0,
  onPickImage,
  onPickAudio,
  onStartAudioRecording,
  onStopAudioRecording,
  onPickCamera,
  uploading = false,
  isRecordingAudio = false,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const { bottom } = useSafeAreaInsets();

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(12, bottom + 8, bottomInset + 8) }]}>
      <View style={styles.inputRow} pointerEvents="box-none">
        <View style={styles.actionsGroup}>
          {onPickCamera ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onPickCamera}
              disabled={disabled || uploading}
              activeOpacity={0.8}
            >
              <ZappIcon name="camera" size={18} color={Colors.light.primary} />
            </TouchableOpacity>
          ) : null}
          {onPickImage ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onPickImage}
              disabled={disabled || uploading}
              activeOpacity={0.8}
            >
              <ZappIcon name="image-outline" size={18} color={Colors.light.primary} />
            </TouchableOpacity>
          ) : null}
          {onPickAudio ? (
            <TouchableOpacity
              style={[styles.iconButton, isRecordingAudio && styles.iconButtonActive]}
              onPressIn={onStartAudioRecording}
              onPressOut={onStopAudioRecording}
              disabled={disabled || uploading}
              activeOpacity={0.8}
            >
              {isRecordingAudio ? (
                <View style={styles.recordingDot} />
              ) : null}
              <ZappIcon
                name={isRecordingAudio ? 'microphone' : 'microphone-outline'}
                size={18}
                color={isRecordingAudio ? '#fff' : Colors.light.primary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Digite sua mensagem..."
          placeholderTextColor={Colors.light.mutedText}
          multiline
          maxLength={500}
          pointerEvents="auto"
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!text.trim() || disabled || uploading) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!text.trim() || disabled || uploading}
          activeOpacity={0.7}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ZappIcon name="send" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: Colors.light.backgroundSecondary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    pointerEvents: 'box-none',
  },
  actionsGroup: {
    flexDirection: 'row',
    gap: 6,
    marginRight: 2,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.light.primary}12`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
    marginRight: 4,
    shadowColor: '#ff3b30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: Colors.light.inputBackground,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '400',
    color: Colors.light.text,
    lineHeight: 20,
    pointerEvents: 'auto',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
