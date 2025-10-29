import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';

const API_BASE_URL = Platform.select({
  ios: 'http://10.127.154.99:5000',
  android: 'http://10.127.154.99:5000',
  web: 'http://10.127.154.99:5000'
});

export const AIModeSwitch: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<string>('rule_based');
  const [canSwitch, setCanSwitch] = useState<boolean>(false);

  useEffect(() => {
    checkAIStatus();
  }, []);

  const checkAIStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-mode`);
      if (response.ok) {
        const data = await response.json();
        setCurrentMode(data.current_mode);
        setCanSwitch(data.can_switch);
      }
    } catch (error) {
      console.log('AI status check failed - using defaults');
    }
  };

  const toggleMode = async () => {
    if (!canSwitch) {
      Alert.alert('AI Models Not Available', 'Using rule-based analysis only.');
      return;
    }

    try {
      const newMode = currentMode === 'rule_based';
      const response = await fetch(`${API_BASE_URL}/ai-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newMode })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentMode(data.current_mode);
        Alert.alert('Mode Changed', `Switched to: ${data.current_mode.replace('_', ' ')} mode`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to switch mode');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analysis Mode</Text>
      
      <TouchableOpacity 
        style={[styles.modeButton, { backgroundColor: currentMode === 'ai_enhanced' ? '#7c3aed' : '#64748b' }]}
        onPress={toggleMode}
      >
        <Text style={styles.modeText}>
          {currentMode === 'ai_enhanced' ? '🤖 AI Enhanced' : '📋 Rule-Based'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.description}>
        {currentMode === 'ai_enhanced' 
          ? '✅ Using ML models for analysis' 
          : '📋 Using enhanced rule-based analysis'
        }
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  modeButton: {
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});
