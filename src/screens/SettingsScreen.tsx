import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StarsBackground } from '../components/StarsBackground';
import { Button } from '../components/ui/Button';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StarsBackground />
      <View style={styles.content}>
        <Text style={styles.title}>Settings Screen</Text>
        <Text style={styles.subtitle}>Customize your Twin Mind experience!</Text>
        <Button 
          title="Back to Dashboard" 
          onPress={() => navigation.goBack()} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#1e293b' 
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20, 
    zIndex: 10 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: 'white', 
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 16, 
    color: 'rgba(255,255,255,0.7)', 
    marginBottom: 32,
    textAlign: 'center'
  },
});
