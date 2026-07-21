import Colors from '@/constants/Colors';
import React from 'react';
import { StyleSheet, TextInput, type TextStyle, type KeyboardTypeOptions } from 'react-native';

interface StyledInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  multiline?: boolean;
  numberOfLines?: number;
  style?: TextStyle | TextStyle[];
  inputStyle?: TextStyle;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  editable?: boolean;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send' | 'none' | 'default' | 'previous';
  autoFocusDelay?: number;
}

export default function StyledInput({
  value,
  onChangeText,
  placeholder,
  placeholderTextColor = Colors.light.mutedText,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'sentences',
  maxLength,
  editable = true,
  autoFocus = false,
  onSubmitEditing,
  returnKeyType = 'done',
  autoFocusDelay,
}: StyledInputProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      multiline={multiline}
      numberOfLines={numberOfLines}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      maxLength={maxLength}
      editable={editable}
      autoFocus={autoFocus}
      onSubmitEditing={onSubmitEditing}
      returnKeyType={returnKeyType}
      style={[
        styles.input,
        multiline && styles.multiline,
        !editable && styles.disabled,
        style,
        inputStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    minHeight: 52,
  },
  multiline: {
    paddingVertical: 14,
    textAlignVertical: 'top',
  },
  disabled: {
    opacity: 0.5,
  },
});
