import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { StarsBackground } from '../components/StarsBackground';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TranscriptScreenProps {
  navigation: any;
}

interface LocalStorageConversation {
  id: number;
  title?: string;
  transcription?: string;
  createdAt?: string;
  mood?: string;
  insights?: string[];
  tags?: string[];
  duration?: number;
  processingStats?: any;
}

interface BackendConversation {
  id: number;
  transcript?: string;
  timestamp?: string;
  created_at?: string;
  sentiment_label?: string;
  sentiment_confidence?: number;
  sentiment_score?: number;
  people_mentioned?: string | string[];
  topics?: string | Array<any>;
  suggestions?: string | string[];
  insights?: string | string[];
  stress_level?: number;
  energy_level?: number;
  word_count?: number;
  duration?: number;
}

// API Configuration
const API_BASE_URL = Platform.select({
  ios: 'http://10.127.154.99:5000',
  android: 'http://10.127.154.99:5000',
  web: 'http://10.127.154.99:5000'
});

export const TranscriptScreen: React.FC<TranscriptScreenProps> = ({ navigation }) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Checking...');
  const [refreshing, setRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState<'local' | 'backend'>('local');

  // Helper functions to safely handle values
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const safeNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const safeArray = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  useEffect(() => {
    checkBackendConnection();
    loadConversations();
  }, []);

  const checkBackendConnection = async () => {
    try {
      console.log('🔗 Checking backend connection...');
      setConnectionStatus('Connecting...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend connected:', data.status);
        setBackendConnected(true);
        
        const features = data.features || {};
        const hasMemory = features.conversation_memory === true;
        const hasPatterns = features.pattern_detection === true;
        
        if (hasMemory && hasPatterns) {
          setConnectionStatus('AI Backend + Memory + Patterns Active');
        } else if (hasMemory) {
          setConnectionStatus('AI Backend + Memory Active');
        } else {
          setConnectionStatus('AI Backend Active');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      console.log('❌ Backend connection failed:', error.message);
      setBackendConnected(false);
      setConnectionStatus('Offline Mode');
    }
  };

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      await loadFromLocalStorage();
      
      if (backendConnected) {
        await loadFromBackendAndMerge();
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromLocalStorage = async () => {
    try {
      const saved = await AsyncStorage.getItem('twinmind_recordings');
      if (saved) {
        const localData: LocalStorageConversation[] = JSON.parse(saved);
        console.log('📱 Local storage data sample:', localData[0]);
        
        // Convert local storage format to display format with safe handling
        const formattedConversations = localData.map((conv: LocalStorageConversation, index: number) => ({
          id: safeNumber(conv.id) || Date.now() + index,
          title: safeString(conv.title) || `Recording ${index + 1}`,
          transcript: safeString(conv.transcription) || 'No transcript available',
          timestamp: safeString(conv.createdAt) || new Date().toISOString(),
          sentiment_label: safeString(conv.mood) || 'neutral',
          sentiment_confidence: 0.7,
          sentiment_score: 0,
          people_mentioned: extractPeopleFromTranscript(safeString(conv.transcription)),
          topics: safeArray(conv.tags),
          suggestions: [],
          insights: safeArray(conv.insights),
          stress_level: 0,
          energy_level: 0.5,
          word_count: safeString(conv.transcription).split(' ').length,
          duration: safeNumber(conv.duration),
          dataSource: 'local'
        }));
        
        setConversations(formattedConversations);
        setDataSource('local');
        console.log(`📱 Loaded ${formattedConversations.length} conversations from local storage`);
        
      } else {
        setConversations([]);
        console.log('📝 No local conversations found');
      }
    } catch (error) {
      console.error('Error loading from local storage:', error);
      setConversations([]);
    }
  };

  const loadFromBackendAndMerge = async () => {
    try {
      console.log('🔄 Checking backend for additional conversations...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_BASE_URL}/conversation-history?days=30&limit=100`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.conversations && data.conversations.length > 0) {
          console.log(`🔄 Found ${data.conversations.length} conversations in backend`);
          
          const parseJsonSafely = (jsonString: string | any, fallback: any = []) => {
            if (!jsonString) return fallback;
            if (typeof jsonString === 'object') return jsonString;
            try {
              return JSON.parse(jsonString);
            } catch (e) {
              return fallback;
            }
          };

          // Convert backend format with safe handling
          const backendConversations = data.conversations.map((conv: BackendConversation, index: number) => ({
            id: safeNumber(conv.id) || (Date.now() + index + 10000),
            title: safeString(conv.transcript).length > 0 ? 
              `${safeString(conv.transcript).substring(0, 40)}...` : 
              `Backend Recording ${index + 1}`,
            transcript: safeString(conv.transcript) || 'No transcript available',
            timestamp: safeString(conv.timestamp || conv.created_at) || new Date().toISOString(),
            sentiment_label: safeString(conv.sentiment_label) || 'neutral',
            sentiment_confidence: safeNumber(conv.sentiment_confidence) || 0.5,
            sentiment_score: safeNumber(conv.sentiment_score) || 0,
            people_mentioned: parseJsonSafely(conv.people_mentioned, []),
            topics: parseJsonSafely(conv.topics, []),
            suggestions: parseJsonSafely(conv.suggestions, []),
            insights: parseJsonSafely(conv.insights, []),
            stress_level: safeNumber(conv.stress_level) || 0,
            energy_level: safeNumber(conv.energy_level) || 0.5,
            word_count: safeNumber(conv.word_count) || 0,
            duration: safeNumber(conv.duration) || 0,
            dataSource: 'backend'
          }));
          
          // Merge with local data (avoid duplicates by ID)
          const existingIds = new Set(conversations.map(c => c.id));
          const newBackendConversations = backendConversations.filter(c => !existingIds.has(c.id));
          
          if (newBackendConversations.length > 0) {
            const mergedConversations = [...conversations, ...newBackendConversations];
            setConversations(mergedConversations);
            console.log(`✅ Merged ${newBackendConversations.length} new conversations from backend`);
          }
        }
      }
    } catch (error: any) {
      console.log('⚠️ Backend merge failed:', error.message);
    }
  };

  // Helper function to extract people from transcript text
  const extractPeopleFromTranscript = (transcript: string): string[] => {
    const transcriptText = safeString(transcript);
    if (!transcriptText) return [];
    
    const words = transcriptText.split(' ');
    const people: string[] = [];
    
    const excludeWords = ['the', 'and', 'but', 'for', 'with', 'about', 'hello', 'hi', 'what', 'how', 'when', 'where'];
    
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 2 && 
          cleanWord[0] === cleanWord[0].toUpperCase() && 
          !excludeWords.includes(cleanWord.toLowerCase())) {
        if (!people.includes(cleanWord)) {
          people.push(cleanWord);
        }
      }
    });
    
    return people.slice(0, 3);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkBackendConnection();
    await loadConversations();
    setRefreshing(false);
  };

  const navigateToInsights = () => {
    navigation.navigate('Insights');
  };

  const navigateToRecord = () => {
    navigation.navigate('Record');
  };

  const formatTimestamp = (timestamp?: string) => {
    const timestampStr = safeString(timestamp);
    if (!timestampStr || timestampStr === '') return 'Unknown time';
    
    try {
      const date = new Date(timestampStr);
      
      if (isNaN(date.getTime())) {
        console.log('⚠️ Invalid date:', timestampStr);
        return 'Recently recorded';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'Recently recorded';
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    const sentimentStr = safeString(sentiment).toLowerCase();
    switch (sentimentStr) {
      case 'positive': return '#22c55e';
      case 'negative': return '#ef4444';
      case 'neutral': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getSentimentEmoji = (sentiment?: string) => {
    const sentimentStr = safeString(sentiment).toLowerCase();
    switch (sentimentStr) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      case 'neutral': return '😐';
      default: return '🤔';
    }
  };

  const deleteConversation = async (id: number) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedConversations = conversations.filter(conv => conv.id !== id);
            setConversations(updatedConversations);
            
            // Update local storage
            const localConversations = updatedConversations.filter(c => c.dataSource === 'local');
            await AsyncStorage.setItem('twinmind_recordings', JSON.stringify(localConversations));
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StarsBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Loading your conversations...</Text>
          <Text style={styles.loadingSubtext}>{safeString(connectionStatus)}</Text>
        </View>
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.container}>
        <StarsBackground />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyEmoji}>🎤</Text>
          </View>
          <Text style={styles.emptyTitle}>No Conversations Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start recording your thoughts and conversations to see them here with AI-powered analysis.
          </Text>
          
          <View style={styles.emptyActions}>
            <Button 
              title="🎤 Start Recording"
              onPress={navigateToRecord}
              style={styles.primaryButton}
            />
            <Button 
              title="📊 View Insights"
              onPress={navigateToInsights}
              variant="outline"
              style={styles.secondaryButton}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StarsBackground />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Your Conversations</Text>
          <Text style={styles.subtitle}>
            {safeString(conversations.length)} conversation{conversations.length !== 1 ? 's' : ''} with AI analysis
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={navigateToInsights}
          >
            <Text style={styles.headerButtonText}>📊</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={navigateToRecord}
          >
            <Text style={styles.headerButtonText}>🎤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Connection Status */}
      <Card style={[styles.statusCard, {
        backgroundColor: backendConnected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(249, 115, 22, 0.15)',
        borderColor: backendConnected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(249, 115, 22, 0.3)'
      }]}>
        <CardContent style={styles.statusContent}>
          <Text style={styles.statusIcon}>
            {backendConnected ? '🟢' : '🟡'}
          </Text>
          <Text style={styles.statusText}>
            {safeString(connectionStatus)}
          </Text>
          <Text style={styles.dataSourceBadge}>
            📱 Local Data
          </Text>
        </CardContent>
      </Card>

      {/* Conversations List */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7c3aed"
            colors={['#7c3aed']}
          />
        }
      >
        {conversations.map((conversation, index) => (
          <Card key={conversation.id} style={styles.conversationCard}>
            <CardContent style={styles.conversationContent}>
              {/* Header Row */}
              <View style={styles.conversationHeader}>
                <View style={styles.conversationInfo}>
                  <Text style={styles.conversationTitle}>
                    {safeString(conversation.title) || `Recording ${index + 1}`}
                  </Text>
                  <View style={styles.conversationMeta}>
                    <Text style={styles.conversationTime}>
                      {formatTimestamp(conversation.timestamp)}
                    </Text>
                    {conversation.dataSource && (
                      <Badge style={styles.sourceBadge}>
                        <Text style={styles.sourceBadgeText}>
                          {safeString(conversation.dataSource) === 'local' ? '📱' : '☁️'}
                        </Text>
                      </Badge>
                    )}
                  </View>
                </View>
                
                <TouchableOpacity 
                  onPress={() => deleteConversation(conversation.id)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>

              {/* Transcript Section */}
              <View style={styles.transcriptSection}>
                <Text style={styles.transcriptText} numberOfLines={3}>
                  {safeString(conversation.transcript) || 'No transcript available'}
                </Text>
              </View>

              {/* Analysis Row */}
              <View style={styles.analysisSection}>
                {/* Sentiment */}
                <View style={styles.sentimentContainer}>
                  <Text style={styles.sentimentEmoji}>
                    {getSentimentEmoji(conversation.sentiment_label)}
                  </Text>
                  <Text style={[styles.sentimentText, { color: getSentimentColor(conversation.sentiment_label) }]}>
                    {safeString(conversation.sentiment_label) || 'neutral'}
                  </Text>
                </View>

                {/* Word Count */}
                {safeNumber(conversation.word_count) > 0 && (
                  <View style={styles.metricContainer}>
                    <Text style={styles.metricText}>
                      📝 {safeString(conversation.word_count)} words
                    </Text>
                  </View>
                )}

                {/* Duration */}
                {safeNumber(conversation.duration) > 0 && (
                  <View style={styles.metricContainer}>
                    <Text style={styles.metricText}>
                      ⏱️ {safeString(conversation.duration)}s
                    </Text>
                  </View>
                )}
              </View>

              {/* People Mentioned */}
              {safeArray(conversation.people_mentioned).length > 0 && (
                <View style={styles.peopleSection}>
                  <Text style={styles.peopleSectionTitle}>👥 People mentioned:</Text>
                  <View style={styles.peopleContainer}>
                    {safeArray(conversation.people_mentioned).slice(0, 3).map((person, idx) => (
                      <Badge key={idx} style={styles.peopleBadge}>
                        <Text style={styles.peopleBadgeText}>{safeString(person)}</Text>
                      </Badge>
                    ))}
                  </View>
                </View>
              )}

              {/* Topics/Tags */}
              {safeArray(conversation.topics).length > 0 && (
                <View style={styles.topicsSection}>
                  <Text style={styles.topicsSectionTitle}>📈 Topics:</Text>
                  <View style={styles.topicsContainer}>
                    {safeArray(conversation.topics).slice(0, 4).map((topic, idx) => (
                      <Badge key={idx} style={styles.topicBadge}>
                        <Text style={styles.topicBadgeText}>
                          {typeof topic === 'object' ? safeString(topic.topic || topic) : safeString(topic)}
                        </Text>
                      </Badge>
                    ))}
                  </View>
                </View>
              )}

              {/* Quick Insights */}
              {safeArray(conversation.insights).length > 0 && (
                <View style={styles.insightsPreview}>
                  <Text style={styles.insightsPreviewTitle}>✨ Quick insight:</Text>
                  <Text style={styles.insightsPreviewText} numberOfLines={2}>
                    {safeString(safeArray(conversation.insights)[0])}
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Action Card */}
        <Card style={styles.actionCard}>
          <CardContent style={styles.actionContent}>
            <Text style={styles.actionEmoji}>🚀</Text>
            <Text style={styles.actionTitle}>Ready for More?</Text>
            <Text style={styles.actionSubtitle}>
              Record more conversations to build your AI insights
            </Text>
            <View style={styles.actionButtons}>
              <Button
                title="🎤 New Recording"
                onPress={navigateToRecord}
                style={styles.actionButton}
              />
              <Button
                title="📊 View Insights"
                onPress={navigateToInsights}
                variant="outline"
                style={styles.actionButton}
              />
            </View>
          </CardContent>
        </Card>
      </ScrollView>

      {/* Navigation Bar */}
      <View style={styles.navigationBar}>
        <Button 
          title="← Back to Dashboard" 
          onPress={() => navigation.goBack()} 
          variant="outline"
          style={styles.navButton}
        />
      </View>
    </View>
  );
};

// Same styles as before...
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#1e293b' 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    zIndex: 10,
  },
  headerContent: {
    flex: 1,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: 'white', 
    marginBottom: 4 
  },
  subtitle: { 
    fontSize: 16, 
    color: 'rgba(255,255,255,0.7)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 18,
  },
  statusCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  dataSourceBadge: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 20,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyActions: {
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#7c3aed',
  },
  secondaryButton: {
    borderColor: 'rgba(124, 58, 237, 0.5)',
  },
  conversationCard: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  conversationContent: {
    gap: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  conversationInfo: {
    flex: 1,
    marginRight: 12,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  conversationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conversationTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  sourceBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: 'rgba(124, 58, 237, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sourceBadgeText: {
    fontSize: 10,
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  transcriptSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
  },
  transcriptText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  analysisSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sentimentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sentimentEmoji: {
    fontSize: 16,
  },
  sentimentText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  metricContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  peopleSection: {
    gap: 6,
  },
  peopleSectionTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  peopleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  peopleBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  peopleBadgeText: {
    color: 'rgba(134, 239, 172, 1)',
    fontSize: 11,
  },
  topicsSection: {
    gap: 6,
  },
  topicsSectionTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  topicBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: 'rgba(99, 102, 241, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  topicBadgeText: {
    color: 'rgba(165, 180, 252, 1)',
    fontSize: 11,
  },
  insightsPreview: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#7c3aed',
  },
  insightsPreviewTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginBottom: 4,
  },
  insightsPreviewText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  actionCard: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderColor: 'rgba(124, 58, 237, 0.3)',
    marginTop: 8,
  },
  actionContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButton: {
    flex: 1,
  },
  navigationBar: {
    padding: 20,
    paddingBottom: 40,
    zIndex: 10,
  },
  navButton: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});
