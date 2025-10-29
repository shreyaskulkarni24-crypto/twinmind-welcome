import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Alert, Animated, TouchableOpacity, Switch, ScrollView, Platform } from 'react-native';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { StarsBackground } from '../components/StarsBackground';
import { useUser } from '../contexts/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

interface RecordScreenProps {
  navigation: any;
}

// Configuration for API endpoint - Update with your actual IP
const API_BASE_URL = 'http://10.127.154.99:5000';

export const RecordScreen: React.FC<RecordScreenProps> = ({ navigation }) => {
  const { userName } = useUser();
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [currentInsight, setCurrentInsight] = useState("");
  
  // Speech recognition mode - Fixed default for mobile
  const [useWebSpeech, setUseWebSpeech] = useState(Platform.OS === 'web');
  const [isListening, setIsListening] = useState(false);
  
  // Platform-specific speech support
  const [webSpeechSupported, setWebSpeechSupported] = useState(false);
  const [webRecognition, setWebRecognition] = useState<any>(null);
  
  // Audio recording (for AI mode)
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Platform-specific speech recognition setup
    if (Platform.OS === 'web') {
      // Check for Web Speech API support
      if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        setWebSpeechSupported(true);
        console.log('✅ Web Speech API supported');
      } else {
        console.log('❌ Web Speech API not supported');
        setUseWebSpeech(false); // Auto-switch to AI mode if Web Speech not available
      }
    } else {
      // On mobile, Web Speech not available, default to AI mode
      setWebSpeechSupported(false);
      setUseWebSpeech(false);
      console.log('📱 Mobile platform - using AI transcription mode');
    }

    // Request audio permissions
    Audio.requestPermissionsAsync();
  }, []);

  useEffect(() => {
    if ((isRecording || isListening) && !isPaused) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isRecording, isListening, isPaused, pulseAnim]);

  // Web Speech Recognition (works in browser only)
 // FIXED: Web Speech Recognition that keeps full conversation
const startWebSpeechRecognition = () => {
  if (!webSpeechSupported) {
    Alert.alert('Not Supported', 'Web Speech API not available. Using AI mode instead.');
    setUseWebSpeech(false);
    return;
  }

  try {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    // IMPORTANT: Keep track of final transcript
    let finalTranscript = '';

    recognition.onstart = () => {
      console.log('🎤 Web Speech started');
      setIsListening(true);
      setIsRecording(true);
      setDuration(0);
      finalTranscript = ''; // Reset on start
      setTranscription("");
      setProcessingStage('🎤 Listening with Web Speech...');
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          // Add to final transcript (NEVER erase)
          finalTranscript += transcript + ' ';
        } else {
          // Show interim results
          interimTranscript += transcript;
        }
      }

      // Display final + interim (full conversation preserved)
      const fullTranscript = finalTranscript + interimTranscript;
      setTranscription(fullTranscript);
    };

    // Auto-restart on silence to prevent stopping
    recognition.onend = () => {
      console.log('🎤 Web Speech ended - attempting restart');
      if (isListening && !isPaused) {
        // Auto-restart to continue listening
        setTimeout(() => {
          if (isListening) {
            try {
              recognition.start();
            } catch (error) {
              console.log('Recognition already started or stopped by user');
            }
          }
        }, 100);
      } else {
        // User stopped - finish session
        setIsListening(false);
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        setProcessingStage('✅ Web speech recognition completed!');
        setTimeout(() => setProcessingStage(''), 2000);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Web Speech error:', event.error);
      
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        // Common errors - just restart
        console.log('Restarting recognition due to:', event.error);
        if (isListening) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (error) {
              console.log('Could not restart recognition');
            }
          }, 1000);
        }
      } else {
        // Serious error
        Alert.alert('Speech Recognition Error', `Error: ${event.error}. Please try again.`);
        setIsListening(false);
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    };

    setWebRecognition(recognition);
    recognition.start();
    
    Alert.alert("⚡ Web Speech Started", "Speak naturally - full conversation will be preserved!");

  } catch (error) {
    console.error('Error starting Web Speech:', error);
    Alert.alert("Error", "Could not start Web Speech recognition. Try AI mode.");
    setIsRecording(false);
    setIsListening(false);
  }
};

// FIXED: Stop function that preserves final transcript
const stopWebSpeechRecognition = () => {
  console.log('🛑 Stopping Web Speech Recognition');
  setIsListening(false); // This prevents auto-restart
  setIsRecording(false);
  
  if (webRecognition) {
    webRecognition.stop();
  }
  
  if (timerRef.current) {
    clearInterval(timerRef.current);
  }
  
  setProcessingStage('✅ Full conversation captured!');
  setTimeout(() => setProcessingStage(''), 2000);
};

  // AI Recording functions
  const startAIRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Audio recording permission is required');
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      setTranscription("");
      setProcessingStage('🤖 Recording for AI processing...');
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);

      Alert.alert("🤖 AI Recording Started", "Speak your thoughts for AI transcription!");
      
    } catch (error) {
      console.error('Error starting AI recording:', error);
      Alert.alert("Error", "Could not start AI recording. Please try again.");
      setIsRecording(false);
    }
  };

  // Main start recording function
  const startRecording = async () => {
    if (useWebSpeech && webSpeechSupported) {
      startWebSpeechRecognition();
    } else {
      await startAIRecording();
    }
  };

  const pauseRecording = async () => {
    try {
      if (useWebSpeech) {
        Alert.alert('Web Speech Mode', 'Pause not supported in Web Speech mode. Use stop instead.');
        return;
      }
      
      if (recording) {
        if (isPaused) {
          await recording.startAsync();
          timerRef.current = setInterval(() => {
            setDuration(prev => prev + 1);
          }, 1000);
        } else {
          await recording.pauseAsync();
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        }
        setIsPaused(!isPaused);
      }
    } catch (error) {
      console.error('Error pausing recording:', error);
    }
  };

  const stopAIRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        
        setIsRecording(false);
        setIsPaused(false);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        // Process the recording with AI
        if (uri) {
          await processRecording(uri);
        }
        
        setRecording(null);
      }
    } catch (error) {
      console.error('Error stopping AI recording:', error);
      Alert.alert("Error", "Could not stop AI recording properly.");
    }
  };

  // Main stop recording function
  const stopRecording = async () => {
    if (useWebSpeech && webSpeechSupported) {
      stopWebSpeechRecognition();
    } else {
      await stopAIRecording();
    }
  };

  // FIXED: Increased timeout and better error handling
  const processRecording = async (audioUri: string) => {
    setIsProcessing(true);
    setProcessingStage('🤖 Processing with AI...');
    
    try {
      // INCREASED TIMEOUT: 60 seconds instead of 15
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a'
      } as any);
      
      setProcessingStage('🤖 AI transcribing... (this may take up to 60 seconds)');
      
      // Call our AI API for transcription
      const response = await fetch(`${API_BASE_URL}/transcribe`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.transcription) {
        setTranscription(result.transcription);
        setProcessingStage('✨ AI transcription complete!');
        
        // Show success message
        setCurrentInsight(`🎉 AI transcription completed! "${result.transcription.substring(0, 30)}..."`);
        setTimeout(() => setCurrentInsight(""), 4000);
        
      } else {
        throw new Error(result.error || 'AI transcription failed');
      }
      
    } catch (error: any) {
      console.error('AI processing error:', error);
      
      if (error.name === 'AbortError') {
        setTranscription("⏰ AI processing timed out. Please try recording shorter audio (under 10 seconds) or check your network connection.");
        setCurrentInsight("⏰ Timeout: Try shorter recordings for faster processing");
      } else {
        setTranscription("🤖 AI server not available. You can type your transcription manually below.");
        setCurrentInsight("🔧 AI server unavailable - manual transcription mode");
      }
      
      setTimeout(() => setCurrentInsight(""), 5000);
      
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  };

  // Add quick manual transcription option
  const enableManualMode = () => {
    Alert.alert(
      '📝 Manual Transcription', 
      'AI server is taking too long. You can type your transcription manually and still save your recording.',
      [
        { text: 'OK', onPress: () => setTranscription("Type your transcription here...") }
      ]
    );
  };

  const generateInsights = async (text: string) => {
    if (!text.trim()) return null;
    
    try {
      setProcessingStage('🧠 Generating AI insights...');
      
      // Call our AI API for insights with shorter timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout for insights
      
      const response = await fetch(`${API_BASE_URL}/generate-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      const result = await response.json();
      
      if (result.success && result.insights) {
        return {
          insights: result.insights.recommendations || [
            "Your thoughts have been processed and saved.",
            "Consider reviewing this recording for further insights.",
            "Great job capturing your ideas!"
          ],
          mood: result.insights.mood || "thoughtful",
          tags: result.insights.topics || ["reflection", "thoughts"]
        };
      } else {
        throw new Error(result.error || 'Insights generation failed');
      }
      
    } catch (error) {
      console.error('Insights generation error:', error);
      
      // Fallback insights
      return {
        insights: [
          "Your recording has been saved successfully.",
          `Transcribed using ${useWebSpeech && webSpeechSupported ? 'Web Speech recognition' : 'AI technology'}.`,
          "You can review and edit your transcription as needed."
        ],
        mood: "thoughtful",
        tags: ["personal-note", useWebSpeech && webSpeechSupported ? "web-speech" : "ai-transcription"]
      };
    }
  };

  const saveRecording = async () => {
    if (!transcription.trim()) {
      Alert.alert('No Content', 'Please ensure you have some transcribed content to save.');
      return;
    }
    
    setIsProcessing(true);
    setProcessingStage('💾 Saving recording...');
    
    try {
      // Generate insights
      const insights = await generateInsights(transcription);
      
      const recordingData = {
        id: Date.now(),
        title: title || `${useWebSpeech && webSpeechSupported ? 'Web Speech' : 'AI'} Recording ${new Date().toLocaleDateString()}`,
        transcription,
        insights: insights?.insights || [],
        duration,
        mood: insights?.mood || "neutral",
        tags: insights?.tags || [],
        createdAt: new Date().toISOString(),
        processingStats: {
          method: useWebSpeech && webSpeechSupported ? 'Web Speech Recognition' : 'AI Processing',
          processingTime: useWebSpeech && webSpeechSupported ? 'Real-time' : 'AI Pipeline',
          platform: Platform.OS
        }
      };

      // Save to AsyncStorage
      const existingRecordings = await AsyncStorage.getItem('twinmind_recordings');
      const recordings = existingRecordings ? JSON.parse(existingRecordings) : [];
      recordings.unshift(recordingData);
      await AsyncStorage.setItem('twinmind_recordings', JSON.stringify(recordings));

      // Reset form
      setTitle("");
      setTranscription("");
      setDuration(0);
      setCurrentInsight(`🎉 ${useWebSpeech && webSpeechSupported ? 'Web Speech' : 'AI'} recording saved! Ready to explore.`);
      
      setTimeout(() => {
        setCurrentInsight("");
        navigation.navigate('Transcript');
      }, 2500);
      
    } catch (error) {
      console.error('Error saving recording:', error);
      Alert.alert("Save Error", "Could not save recording. Please try again.");
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
      <StarsBackground />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.title}>
                {useWebSpeech && webSpeechSupported ? '⚡ Web Speech' : '🤖 AI Voice'} Recording
              </Text>
              <Text style={styles.subtitle}>
                Hey {userName}, {useWebSpeech && webSpeechSupported ? 'speak naturally!' : 'AI will transcribe!'}
              </Text>
            </View>
          </View>

          {/* Mode Toggle - ALWAYS SHOW FOR BETTER UX */}
          <Card style={styles.modeCard}>
            <CardContent style={styles.modeContent}>
              <View style={styles.modeToggle}>
                <Text style={styles.modeLabel}>
                  {useWebSpeech 
                    ? (webSpeechSupported ? '⚡ Web Speech (Real-time)' : '⚡ Web Speech (Not Supported)') 
                    : '🤖 AI Transcription (High Accuracy)'
                  }
                </Text>
                <Switch
                  value={useWebSpeech}
                  onValueChange={setUseWebSpeech}
                  disabled={isRecording || isListening || (Platform.OS !== 'web')}
                  trackColor={{ false: '#7c3aed', true: '#10b981' }}
                  thumbColor={useWebSpeech ? '#ffffff' : '#ffffff'}
                />
              </View>
              <Text style={styles.modeDescription}>
                {Platform.OS !== 'web' 
                  ? '📱 Mobile: AI transcription provides the best accuracy for mobile recording'
                  : useWebSpeech 
                    ? (webSpeechSupported 
                        ? '⚡ Instant web-based transcription, real-time results, battery efficient'
                        : '❌ Web Speech not supported on this browser. Using AI mode.'
                      )
                    : '🤖 Best accuracy, handles technical terms, may take 30-60 seconds'
                }
              </Text>
            </CardContent>
          </Card>

          {/* Processing Status */}
          {(isProcessing || processingStage) && (
            <Card style={styles.processingCard}>
              <CardContent style={styles.processingContent}>
                <Text style={styles.processingText}>
                  {processingStage || 'Processing...'}
                </Text>
                <View style={styles.processingIndicator} />
                
                {/* Add manual option during long processing */}
                {isProcessing && !useWebSpeech && (
                  <TouchableOpacity onPress={enableManualMode} style={styles.manualButton}>
                    <Text style={styles.manualButtonText}>📝 Switch to Manual Typing</Text>
                  </TouchableOpacity>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recording Controls */}
          <Card style={styles.recordingCard}>
            <CardContent style={styles.recordingContent}>
              <View style={styles.recordingIndicator}>
                <Animated.View style={[
                  styles.recordingButton,
                  (isRecording || isListening) && !isPaused && { transform: [{ scale: pulseAnim }] },
                  (isRecording || isListening)
                    ? isPaused 
                      ? styles.recordingButtonPaused 
                      : styles.recordingButtonActive
                    : styles.recordingButtonInactive
                ]}>
                  <TouchableOpacity
                    style={styles.recordingButtonTouchable}
                    onPress={(isRecording || isListening) ? stopRecording : startRecording}
                    disabled={isProcessing}
                  >
                    <Text style={styles.recordingEmoji}>
                      {(isRecording || isListening) ? "⏹️" : "🎤"}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
                
                {(isRecording || isListening) && !isPaused && (
                  <View style={styles.pulseRing} />
                )}
              </View>

              <Text style={styles.duration}>{formatDuration(duration)}</Text>

              <View style={styles.controlsContainer}>
                {!(isRecording || isListening) ? (
                  <Button
                    title={useWebSpeech && webSpeechSupported ? "⚡ Start Web Speech" : "🤖 Start AI Recording"}
                    onPress={startRecording}
                    style={[styles.startButton, useWebSpeech && webSpeechSupported ? styles.webSpeechButton : styles.aiButton]}
                    disabled={isProcessing}
                  />
                ) : (
                  <View style={styles.activeControls}>
                    {!(useWebSpeech && webSpeechSupported) && (
                      <Button
                        title={isPaused ? "▶️ Resume" : "⏸️ Pause"}
                        onPress={pauseRecording}
                        variant="outline"
                        style={styles.controlButton}
                      />
                    )}
                    <Button
                      title="⏹️ Stop Recording"
                      onPress={stopRecording}
                      style={styles.stopButton}
                    />
                  </View>
                )}
              </View>
            </CardContent>
          </Card>

          {/* Transcription Display */}
          {transcription && (
            <Card style={styles.transcriptionCard}>
              <CardHeader>
                <Text style={styles.transcriptionTitle}>
                  {useWebSpeech && webSpeechSupported ? '⚡ Web Speech Transcription' : '🤖 AI Transcription'}
                </Text>
                <Text style={styles.transcriptionSubtitle}>
                  {useWebSpeech && webSpeechSupported
                    ? 'Real-time • Editable • Browser-based'
                    : 'AI-Powered • Editable • High Accuracy • Edit as needed'
                  }
                </Text>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={transcription}
                  onChangeText={setTranscription}
                  placeholder={useWebSpeech && webSpeechSupported
                    ? "Your real-time web speech transcription will appear here..."
                    : "Your AI transcription will appear here... (you can edit this text)"
                  }
                  style={styles.transcriptionInput}
                  numberOfLines={6}
                  multiline={true}
                />
              </CardContent>
            </Card>
          )}

          {/* Save Recording */}
          {transcription && !(isRecording || isListening) && (
            <Card style={styles.saveCard}>
              <CardContent>
                <Input
                  value={title}
                  onChangeText={setTitle}
                  placeholder={`Give your ${useWebSpeech && webSpeechSupported ? 'web speech' : 'AI'} recording a title (optional)`}
                  style={styles.titleInput}
                />
                
                <Button
                  title={
                    isProcessing 
                      ? `${processingStage || 'Processing...'}` 
                      : "💾 Save & Generate Insights"
                  }
                  onPress={saveRecording}
                  disabled={isProcessing}
                  style={styles.saveButton}
                />
              </CardContent>
            </Card>
          )}

          {/* Success Message */}
          {currentInsight && (
            <View style={styles.insightAlert}>
              <Badge style={styles.insightBadge}>
                <Text style={styles.insightText}>{currentInsight}</Text>
              </Badge>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* API Status Indicator */}
      <View style={styles.apiStatus}>
        <Text style={styles.apiStatusText}>
          {useWebSpeech && webSpeechSupported
            ? '⚡ Web Speech Ready • Browser-based • Real-time'
            : `🤖 TwinMind AI Ready • Server: ${API_BASE_URL} • 60s timeout`
          }
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 60,
  },
  content: {
    padding: 20,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 16,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modeCard: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  modeContent: {
    paddingVertical: 16,
  },
  modeToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  modeDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 4,
  },
  processingCard: {
    marginBottom: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
  },
  processingContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  processingText: {
    color: 'rgba(147, 197, 253, 1)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  processingIndicator: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  manualButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  manualButtonText: {
    color: 'rgba(251, 191, 36, 1)',
    fontSize: 14,
    fontWeight: '600',
  },
  recordingCard: {
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  recordingContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  recordingIndicator: {
    position: 'relative',
    marginBottom: 24,
  },
  recordingButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  recordingButtonInactive: {
    backgroundColor: 'rgba(124, 58, 237, 0.6)',
  },
  recordingButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  recordingButtonPaused: {
    backgroundColor: 'rgba(245, 158, 11, 0.8)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  recordingButtonTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingEmoji: {
    fontSize: 48,
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    top: -10,
    left: -10,
  },
  duration: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  controlsContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  startButton: {
    width: '100%',
    backgroundColor: '#7c3aed',
    paddingVertical: 16,
  },
  webSpeechButton: {
    backgroundColor: '#10b981',
  },
  aiButton: {
    backgroundColor: '#7c3aed',
  },
  activeControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  stopButton: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  transcriptionCard: {
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  transcriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    paddingVertical: 8,
  },
  transcriptionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  transcriptionInput: {
    minHeight: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  saveCard: {
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleInput: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  saveButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
    paddingVertical: 16,
  },
  insightAlert: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    zIndex: 50,
  },
  insightBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  insightText: {
    color: 'rgba(134, 239, 172, 1)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  apiStatus: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    right: 20,
    zIndex: 5,
  },
  apiStatusText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    textAlign: 'center',
  },
});
