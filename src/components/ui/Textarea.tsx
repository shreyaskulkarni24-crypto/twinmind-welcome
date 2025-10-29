import React from 'react';
import { TextInput, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface TextareaProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  numberOfLines?: number;
  maxLength?: number;
}

export const Textarea: React.FC<TextareaProps> = ({ 
  value, 
  onChangeText, 
  placeholder, 
  style, 
  textStyle,
  numberOfLines = 4,
  maxLength
}) => {
  return (
    <TextInput
      style={[styles.textarea, style, textStyle]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="rgba(255, 255, 255, 0.5)"
      multiline={true}
      numberOfLines={numberOfLines}
      maxLength={maxLength}
      textAlignVertical="top"
    />
  );
};

const styles = StyleSheet.create({
  textarea: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: 'white',
    minHeight: 100,
  },
});
