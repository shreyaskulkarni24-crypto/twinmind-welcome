import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Animated } from 'react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StarsBackground } from '../components/StarsBackground';
import { useUser } from '../contexts/UserContext';

interface WelcomeScreenProps {
  navigation: any;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const { setUserData } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    {
      title: "Welcome to Twin Mind",
      subtitle: "Your AI-powered voice companion",
      emoji: "🧠",
      description: "Transform your thoughts into insights with the power of AI. Record, transcribe, and discover patterns in your mind.",
      features: []
    },
    {
      title: "Speak Your Mind",
      subtitle: "Natural voice interaction",
      emoji: "🎤",
      description: "Simply speak naturally and let Twin Mind capture your thoughts, ideas, and reflections.",
      features: ["Real-time transcription", "Smart insights"]
    },
    {
      title: "Complete Privacy",
      subtitle: "Your data stays on your device",
      emoji: "🔒",
      description: "Zero cloud dependency. All processing happens locally for maximum privacy and security.",
      features: ["Local storage", "Offline capable"]
    },
    {
      title: "Let's Get Started",
      subtitle: "Tell us your name",
      emoji: "👋",
      description: "What would you like us to call you?",
      features: [],
      showInput: true
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!userName.trim()) return;
    
    setIsLoading(true);
    try {
      await setUserData(userName.trim(), true);
      navigation.replace('Dashboard');
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
      <StarsBackground />
      
      <View style={styles.content}>
        {/* Progress Indicators */}
        <View style={styles.progressContainer}>
          <View style={styles.progressDots}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index <= currentStep && styles.progressDotActive
                ]}
              />
            ))}
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>
              {currentStep + 1} of {steps.length}
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, getIconStyle(currentStep)]}>
              <Text style={styles.iconEmoji}>{currentStepData.emoji}</Text>
            </View>
            {currentStep === 0 && (
              <View style={styles.sparkleIcon}>
                <Text style={styles.sparkleEmoji}>✨</Text>
              </View>
            )}
          </View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{currentStepData.title}</Text>
            <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>
          </View>

          {/* Content Card */}
          <View style={styles.contentCard}>
            <Text style={styles.description}>
              {currentStepData.description}
            </Text>

            {/* Features */}
            {currentStepData.features.length > 0 && (
              <View style={styles.featuresContainer}>
                {currentStepData.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureDot} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Name Input */}
            {currentStepData.showInput && (
              <View style={styles.inputContainer}>
                <Input
                  value={userName}
                  onChangeText={setUserName}
                  placeholder="Enter your name"
                  style={styles.nameInput}
                />
              </View>
            )}
          </View>
        </View>

        {/* Navigation */}
        <View style={styles.navigationContainer}>
          <Button
            title="Back"
            onPress={prevStep}
            disabled={currentStep === 0}
            variant="outline"
            style={[styles.navButton, currentStep === 0 && styles.disabledButton]}
          />
          
          <Button
            title={
              isLoading 
                ? "Setting up..." 
                : currentStep === steps.length - 1 
                  ? "Get Started" 
                  : "Next"
            }
            onPress={nextStep}
            disabled={
              isLoading || 
              (currentStep === steps.length - 1 && !userName.trim())
            }
            style={[styles.navButton, styles.nextButton]}
          />
        </View>
      </View>
    </View>
  );
};

const getIconStyle = (step: number) => {
  const styles = [
    { backgroundColor: 'rgba(99, 102, 241, 0.8)' }, // Brain - Indigo
    { backgroundColor: 'rgba(16, 185, 129, 0.8)' }, // Mic - Emerald  
    { backgroundColor: 'rgba(34, 197, 94, 0.8)' },  // Lock - Green
    { backgroundColor: 'rgba(168, 85, 247, 0.8)' }  // Wave - Purple
  ];
  return styles[step] || styles[0];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 12,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressDotActive: {
    backgroundColor: '#7c3aed',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  progressBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconEmoji: {
    fontSize: 56,
  },
  sparkleIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sparkleEmoji: {
    fontSize: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  contentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  description: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 24,
  },
  featuresContainer: {
    alignItems: 'center',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7c3aed',
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  inputContainer: {
    marginTop: 8,
  },
  nameInput: {
    textAlign: 'center',
    fontSize: 18,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingTop: 32,
  },
  navButton: {
    flex: 1,
    paddingVertical: 16,
  },
  nextButton: {
    backgroundColor: '#7c3aed',
  },
  disabledButton: {
    opacity: 0.3,
  },
});
