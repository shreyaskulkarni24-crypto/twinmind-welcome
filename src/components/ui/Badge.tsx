import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default',
  style,
  textStyle
}) => {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'success':
        return styles.successBadge;
      case 'warning':
        return styles.warningBadge;
      case 'error':
        return styles.errorBadge;
      default:
        return styles.defaultBadge;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'success':
        return styles.successText;
      case 'warning':
        return styles.warningText;
      case 'error':
        return styles.errorText;
      default:
        return styles.defaultText;
    }
  };

  return (
    <View style={[styles.badge, getBadgeStyle(), style]}>
      <Text style={[styles.text, getTextStyle(), textStyle]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  defaultBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  successBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  warningBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  errorBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  defaultText: {
    color: '#a5b4fc',
  },
  successText: {
    color: '#86efac',
  },
  warningText: {
    color: '#fbbf24',
  },
  errorText: {
    color: '#fca5a5',
  },
});
