import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StarsBackground } from '../components/StarsBackground';
import { useUser } from '../contexts/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Mood = 'positive' | 'negative' | 'neutral' | 'thoughtful' | 'concerned' | 'excited';

interface Recording {
  id: number;
  title: string;
  transcript?: string;
  transcription?: string;
  duration: number;
  mood: Mood;
  insights: string[];
  tags: string[];
  createdAt: Date;
  sentiment?: {
    label: string;
    confidence: number;
    score: number;
  };
  topics?: Array<{
    topic: string;
    relevance: number;
  }>;
  suggestions?: string[];
  stress_level?: number;
  energy_level?: number;
  people_mentioned?: string[];
  analysis_confidence?: number;
}

interface InsightsScreenProps {
  navigation: any;
}

const API_BASE_URL = Platform.select({
  ios: 'http://10.127.154.99:5000',
  android: 'http://10.127.154.99:5000',
  web: 'http://10.127.154.99:5000'
});

export const InsightsScreen: React.FC<InsightsScreenProps> = ({ navigation }) => {
  const { userName } = useUser();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [memoryStats, setMemoryStats] = useState<any>(null);

  const moodColors: Record<Mood, string> = {
    positive: 'rgba(34, 197, 94, 0.3)',
    negative: 'rgba(239, 68, 68, 0.3)',
    neutral: 'rgba(156, 163, 175, 0.3)',
    thoughtful: 'rgba(59, 130, 246, 0.3)',
    concerned: 'rgba(249, 115, 22, 0.3)',
    excited: 'rgba(147, 51, 234, 0.3)'
  };

  const moodIcons: Record<Mood, string> = {
    positive: '😊',
    negative: '😔',
    neutral: '😐',
    thoughtful: '🤔',
    concerned: '😟',
    excited: '🤗'
  };

  // Helper function to safely convert to string
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  // Helper function to safely get number
  const safeNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    await checkBackendConnection();
    await loadRealRecordings();
    await loadMemoryStats();
  };

  const checkBackendConnection = async () => {
    try {
      console.log('🔗 Checking backend connection...');
      setConnectionStatus('Checking backend...');
      
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
        setBackendAvailable(true);
        
        const hasMemory = data.features?.conversation_memory === true;
        setConnectionStatus(hasMemory ? 'AI Backend + Memory + Patterns Active' : 'AI Backend Active');
        
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      console.log('❌ Backend connection failed:', error.message);
      setBackendAvailable(false);
      setConnectionStatus('Offline Mode');
    }
  };

  const loadRealRecordings = async () => {
    setIsLoading(true);
    try {
      if (backendAvailable) {
        console.log('🔄 Loading REAL conversation history from backend...');
        await fetchRealConversationHistory();
      } else {
        await loadFromLocalStorage();
      }
    } catch (error) {
      console.error("Error loading recordings:", error);
      await loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRealConversationHistory = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_BASE_URL}/conversation-history?days=30&limit=50`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.conversations && data.conversations.length > 0) {
        console.log(`✅ Loaded ${data.conversations.length} REAL conversations from backend`);
        
        const realRecordings = data.conversations.map((conv: any, index: number) => {
          let people = [];
          let topics = [];
          let insights = [];
          let suggestions = [];
          
          try {
            people = conv.people_mentioned ? JSON.parse(conv.people_mentioned) : [];
          } catch (e) { people = []; }
          
          try {
            topics = conv.topics ? JSON.parse(conv.topics) : [];
          } catch (e) { topics = []; }
          
          try {
            insights = conv.insights ? JSON.parse(conv.insights) : [];
          } catch (e) { insights = []; }
          
          try {
            suggestions = conv.suggestions ? JSON.parse(conv.suggestions) : [];
          } catch (e) { suggestions = []; }

          const transcriptText = safeString(conv.transcript || conv.transcription);

          return {
            id: conv.id || (Date.now() + index),
            title: transcriptText ? 
              `${transcriptText.substring(0, 30)}...` : 
              `Recording ${index + 1}`,
            transcript: transcriptText,
            duration: safeNumber(conv.duration) || 60,
            mood: mapSentimentToMood(conv.sentiment_label),
            
            insights: insights.length > 0 ? insights.filter((i: any) => typeof i === 'string') : [
              `📝 ${safeString(conv.sentiment_label) || 'Neutral'} conversation detected`,
              ...(people.length > 0 ? [`👤 Mentioned: ${people.join(', ')}`] : []),
              ...(topics.length > 0 ? [`📊 Topics: ${topics.map((t: any) => typeof t === 'object' ? safeString(t.topic) : safeString(t)).join(', ')}`] : [])
            ],
            
            tags: topics.length > 0 ? 
              topics.map((t: any) => typeof t === 'object' ? safeString(t.topic) : safeString(t)).filter(Boolean) : 
              ['conversation'],
            
            people_mentioned: people.filter((p: any) => typeof p === 'string' && p.trim()),
            
            createdAt: new Date(conv.timestamp || conv.created_at || Date.now()),
            sentiment: {
              label: safeString(conv.sentiment_label) || 'neutral',
              confidence: safeNumber(conv.sentiment_confidence) || 0.5,
              score: safeNumber(conv.sentiment_score) || 0
            },
            topics: topics,
            suggestions: suggestions.filter((s: any) => typeof s === 'string'),
            stress_level: safeNumber(conv.stress_level) || 0,
            energy_level: safeNumber(conv.energy_level) || 0.5,
            analysis_confidence: safeNumber(conv.analysis_confidence) || 0.5
          };
        });
        
        setRecordings(realRecordings);
        await AsyncStorage.setItem('twinmind_recordings', JSON.stringify(realRecordings));
        console.log('💾 Real conversation data saved to local storage');
        
      } else {
        console.log('ℹ️ No conversations found - start recording to see insights!');
        setRecordings([]);
      }
    } catch (error: any) {
      console.log('⚠️ Failed to fetch real conversations:', error.message);
      await loadFromLocalStorage();
    }
  };

  const loadFromLocalStorage = async () => {
    try {
      const saved = await AsyncStorage.getItem('twinmind_recordings');
      if (saved) {
        const parsedRecordings = JSON.parse(saved);
        
        const fixedRecordings = parsedRecordings.map((recording: any) => {
          const transcriptText = safeString(recording.transcript || recording.transcription);
          
          return {
            ...recording,
            id: safeNumber(recording.id) || Date.now(),
            transcript: transcriptText,
            title: safeString(recording.title) || (transcriptText ? `${transcriptText.substring(0, 30)}...` : 'Recording'),
            duration: safeNumber(recording.duration) || 60,
            mood: recording.mood || 'neutral',
            insights: Array.isArray(recording.insights) ? 
              recording.insights.filter((insight: any) => typeof insight === 'string') : 
              (transcriptText ? [
                `📝 Analysis: ${safeString(recording.mood) || 'neutral'} conversation`,
                `🎤 Transcript: "${transcriptText.substring(0, 50)}${transcriptText.length > 50 ? '...' : ''}"`
              ] : ['📝 No transcript available']),
            tags: Array.isArray(recording.tags) ? 
              recording.tags.filter((tag: any) => typeof tag === 'string' && tag.trim()) : [],
            people_mentioned: Array.isArray(recording.people_mentioned) ? 
              recording.people_mentioned.filter((person: any) => typeof person === 'string' && person.trim()) : [],
            createdAt: new Date(recording.createdAt || Date.now()),
            stress_level: safeNumber(recording.stress_level) || 0,
            energy_level: safeNumber(recording.energy_level) || 0.5
          };
        });
        
        setRecordings(fixedRecordings);
        console.log(`📱 Loaded ${fixedRecordings.length} recordings from local storage`);
      } else {
        console.log('📝 No local recordings found - record your first conversation!');
        setRecordings([]);
      }
    } catch (error) {
      console.error("Error loading from local storage:", error);
      setRecordings([]);
    }
  };

  const loadMemoryStats = async () => {
    if (!backendAvailable) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/memory-stats`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMemoryStats(data.memory_stats);
          console.log('📊 Memory stats loaded');
        }
      }
    } catch (error) {
      console.log('⚠️ Could not load memory stats');
    }
  };

  const mapSentimentToMood = (sentiment: string): Mood => {
    switch (safeString(sentiment).toLowerCase()) {
      case 'positive': return 'positive';
      case 'negative': return 'negative';
      case 'neutral': return 'neutral';
      case 'thoughtful': return 'thoughtful';
      case 'concerned': return 'concerned';
      default: return 'neutral';
    }
  };

  const refreshData = async () => {
    setConnectionStatus('Refreshing...');
    await initializeData();
  };

  const getOverallStats = () => {
    const totalRecordings = recordings.length;
    const totalDuration = recordings.reduce((sum, r) => sum + safeNumber(r.duration), 0);
    
    const moodDistribution: Record<string, number> = {};
    recordings.forEach(r => {
      const mood = safeString(r.mood) || 'neutral';
      moodDistribution[mood] = (moodDistribution[mood] || 0) + 1;
    });
    
    const sortedMoods = Object.entries(moodDistribution).sort(([,a], [,b]) => (b as number) - (a as number));
    const mostCommonMood: Mood = sortedMoods.length > 0 ? sortedMoods[0][0] as Mood : 'neutral';

    const avgStress = recordings.reduce((sum, r) => sum + safeNumber(r.stress_level), 0) / Math.max(recordings.length, 1);
    const avgEnergy = recordings.reduce((sum, r) => sum + safeNumber(r.energy_level), 0) / Math.max(recordings.length, 1);

    return {
      totalRecordings,
      totalDuration: Math.round(totalDuration / 60),
      mostCommonMood,
      moodDistribution,
      averageStress: avgStress || 0,
      averageEnergy: avgEnergy || 0.5
    };
  };

  const getAllInsights = () => {
    const memoryInsights = memoryStats ? [
      `🧠 ${safeNumber(memoryStats.total_conversations)} conversations in memory`,
      `📊 ${safeNumber(memoryStats.conversations_last_24h)} conversations today`,
      ...(safeNumber(memoryStats.average_stress_level) > 0.7 ? ['😰 Higher stress levels detected recently'] : 
          safeNumber(memoryStats.average_stress_level) > 0.4 ? ['😌 Moderate stress levels - well managed'] :
          ['✨ Low stress levels - excellent emotional management'])
    ] : [];
    
    const recordingInsights = recordings.flatMap(r => 
      Array.isArray(r.insights) ? r.insights.filter(insight => typeof insight === 'string' && insight.trim()) : []
    );
    
    return [...memoryInsights, ...recordingInsights].slice(0, 10);
  };

  const getAllTags = () => {
    const tagCounts: Record<string, number> = {};
    recordings.flatMap(r => Array.isArray(r.tags) ? r.tags : []).forEach(tag => {
      const tagString = safeString(tag).trim();
      if (tagString) {
        tagCounts[tagString] = (tagCounts[tagString] || 0) + 1;
      }
    });
    
    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 8)
      .map(([tag, count]) => ({ tag: safeString(tag), count: safeNumber(count) }));
  };

  const getAllPeopleMentioned = () => {
    const peopleCounts: Record<string, number> = {};
    recordings.flatMap(r => Array.isArray(r.people_mentioned) ? r.people_mentioned : []).forEach(person => {
      const personString = safeString(person).trim();
      if (personString) {
        peopleCounts[personString] = (peopleCounts[personString] || 0) + 1;
      }
    });
    
    return Object.entries(peopleCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([person, count]) => ({ person: safeString(person), count: safeNumber(count) }));
  };

  const stats = getOverallStats();
  const insights = getAllInsights();
  const topTags = getAllTags();
  const topPeople = getAllPeopleMentioned();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
        <StarsBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Loading your real insights...</Text>
          <Text style={styles.loadingSubtext}>{safeString(connectionStatus)}</Text>
        </View>
      </View>
    );
  }

  if (recordings.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
        <StarsBackground />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyEmoji}>🧠</Text>
          </View>
          <Text style={styles.emptyTitle}>No recordings yet</Text>
          <Text style={styles.emptySubtitle}>
            Start recording your thoughts to see real AI-powered insights from your actual conversations.
          </Text>
          <Button
            title="Start Recording"
            onPress={() => navigation.navigate('Record')}
            style={styles.emptyButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
      <StarsBackground />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Button
            title="← Back"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.backButton}
          />
          <View style={styles.headerText}>
            <Text style={styles.title}>Real AI Insights</Text>
            <Text style={styles.subtitle}>
              {backendAvailable ? 'Live from your conversations' : 'Offline mode'}
            </Text>
          </View>
          <Button
            title="🔄"
            onPress={refreshData}
            variant="outline"
            style={styles.refreshButton}
          />
        </View>

        {/* Connection Status */}
        <Card style={[styles.statusCard, { 
          backgroundColor: backendAvailable ? 'rgba(34, 197, 94, 0.15)' : 'rgba(249, 115, 22, 0.15)',
          borderColor: backendAvailable ? 'rgba(34, 197, 94, 0.3)' : 'rgba(249, 115, 22, 0.3)'
        }]}>
          <CardContent style={styles.statusContent}>
            <Text style={styles.statusIcon}>
              {backendAvailable ? '🟢' : '🟡'}
            </Text>
            <Text style={styles.statusText}>
              {safeString(connectionStatus)}
            </Text>
            <Badge style={styles.dataSourceBadge}>
              <Text style={styles.dataSourceText}>
                🎯 Local Data
              </Text>
            </Badge>
          </CardContent>
        </Card>

        {/* Memory Intelligence Status */}
        {memoryStats && (
          <Card style={styles.intelligenceCard}>
            <CardContent style={styles.intelligenceContent}>
              <View style={styles.intelligenceHeader}>
                <Text style={styles.intelligenceIcon}>🧠</Text>
                <View style={styles.intelligenceInfo}>
                  <Text style={styles.intelligenceTitle}>AI Memory Active</Text>
                  <Text style={styles.intelligenceSubtitle}>
                    {memoryStats.learning_enabled ? 'Learning from your patterns' : 'Storing conversations'}
                  </Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${Math.min((safeNumber(memoryStats.total_conversations) / 50) * 100, 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {safeString(safeNumber(memoryStats.total_conversations))} conversations in memory
              </Text>
            </CardContent>
          </Card>
        )}

        {/* Real Stats Overview */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <Text style={styles.statNumber}>{safeString(stats.totalRecordings)}</Text>
              <Text style={styles.statLabel}>Real Conversations</Text>
            </CardContent>
          </Card>
          
          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <Text style={styles.statNumber}>{safeString(stats.totalDuration)}m</Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </CardContent>
          </Card>

          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <Text style={styles.statNumber}>{safeString(Math.round(stats.averageStress * 100))}%</Text>
              <Text style={styles.statLabel}>Avg Stress</Text>
            </CardContent>
          </Card>
        </View>

        {/* Real Mood Analysis */}
        <Card style={styles.analysisCard}>
          <CardHeader>
            <Text style={styles.cardTitle}>💭 Real Sentiment Analysis</Text>
          </CardHeader>
          <CardContent>
            <View style={styles.moodOverview}>
              <Text style={styles.moodIcon}>
                {moodIcons[stats.mostCommonMood]}
              </Text>
              <Text style={styles.moodText}>
                Your most common sentiment is{' '}
                <Text style={styles.moodHighlight}>
                  {safeString(stats.mostCommonMood)}
                </Text>
              </Text>
              <Text style={styles.moodSubtext}>
                Stress: {safeString(Math.round(stats.averageStress * 100))}% • Energy: {safeString(Math.round(stats.averageEnergy * 100))}%
              </Text>
            </View>
            
            {Object.keys(stats.moodDistribution).length > 0 && (
              <View style={styles.moodDistribution}>
                {Object.entries(stats.moodDistribution).map(([mood, count]) => (
                  <View key={mood} style={styles.moodItem}>
                    <View style={styles.moodInfo}>
                      <Text style={styles.moodItemIcon}>
                        {moodIcons[mood as Mood]}
                      </Text>
                      <Text style={styles.moodItemLabel}>
                        {safeString(mood)}
                      </Text>
                    </View>
                    <View style={[
                      styles.moodBadge,
                      { backgroundColor: moodColors[mood as Mood] }
                    ]}>
                      <Text style={styles.moodCount}>
                        {safeString(count)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>

        {/* REAL People You Actually Mentioned */}
        {topPeople.length > 0 && (
          <Card style={styles.analysisCard}>
            <CardHeader>
              <Text style={styles.cardTitle}>👥 People You Actually Mentioned</Text>
            </CardHeader>
            <CardContent>
              <View style={styles.tagContainer}>
                {topPeople.map(({ person, count }) => (
                  <Badge key={person} style={styles.peopleBadge}>
                    <Text style={styles.peopleText}>
                      {safeString(person)} ({safeString(count)})
                    </Text>
                  </Badge>
                ))}
              </View>
              <Text style={styles.dataSourceText}>
                📊 From your real voice recordings
              </Text>
            </CardContent>
          </Card>
        )}

        {/* Real Topics */}
        {topTags.length > 0 && (
          <Card style={styles.analysisCard}>
            <CardHeader>
              <Text style={styles.cardTitle}>📈 Your Real Topics</Text>
            </CardHeader>
            <CardContent>
              <View style={styles.tagContainer}>
                {topTags.map(({ tag, count }) => (
                  <Badge key={tag} style={styles.topicBadge}>
                    <Text style={styles.topicText}>
                      {safeString(tag)} ({safeString(count)})
                    </Text>
                  </Badge>
                ))}
              </View>
            </CardContent>
          </Card>
        )}

        {/* Real Smart Insights */}
        {insights.length > 0 && (
          <Card style={styles.analysisCard}>
            <CardHeader>
              <Text style={styles.cardTitle}>✨ Real AI Insights</Text>
            </CardHeader>
            <CardContent>
              <View style={styles.insightsList}>
                {insights.slice(0, 8).map((insight, index) => (
                  <View key={index} style={styles.insightItem}>
                    <View style={styles.insightDot} />
                    <Text style={styles.insightText}>
                      {safeString(insight)}
                    </Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        )}

        {/* Action Card */}
        <Card style={styles.actionCard}>
          <CardContent style={styles.actionContent}>
            <Text style={styles.actionEmoji}>🚀</Text>
            <Text style={styles.actionTitle}>
              Keep exploring, {safeString(userName)}!
            </Text>
            <Text style={styles.actionSubtitle}>
              Record more conversations to see deeper insights from your actual voice data.
            </Text>
            <Button
              title="Record New Thoughts"
              onPress={() => navigation.navigate('Record')}
              style={styles.actionButton}
            />
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <Card style={styles.privacyCard}>
          <CardContent style={styles.privacyContent}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <Text style={styles.privacyText}>
              All insights generated from your real voice recordings. 100% private and local processing.
            </Text>
          </CardContent>
        </Card>
      </ScrollView>
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
    zIndex: 10,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
    fontSize: 16,
  },
  loadingSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
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
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  statusCard: {
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
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: 'rgba(124, 58, 237, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dataSourceText: {
    color: 'rgba(196, 181, 253, 1)',
    fontSize: 10,
    fontWeight: '500',
  },
  intelligenceCard: {
    marginBottom: 20,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  intelligenceContent: {
    paddingVertical: 16,
  },
  intelligenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  intelligenceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  intelligenceInfo: {
    flex: 1,
  },
  intelligenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  intelligenceSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  analysisCard: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    paddingVertical: 8,
  },
  moodOverview: {
    alignItems: 'center',
    marginBottom: 24,
  },
  moodIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  moodText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  moodHighlight: {
    color: 'white',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  moodSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 4,
  },
  moodDistribution: {
    gap: 12,
  },
  moodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moodItemIcon: {
    fontSize: 16,
  },
  moodItemLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'capitalize',
  },
  moodBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  moodCount: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: 'rgba(99, 102, 241, 0.4)',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  topicText: {
    color: 'rgba(165, 180, 252, 1)',
    fontSize: 12,
    fontWeight: '500',
  },
  peopleBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  peopleText: {
    color: 'rgba(134, 239, 172, 1)',
    fontSize: 12,
    fontWeight: '500',
  },
  insightsList: {
    gap: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7c3aed',
    marginTop: 6,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  actionCard: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: 'rgba(124, 58, 237, 0.3)',
    marginBottom: 24,
  },
  actionContent: {
    alignItems: 'center',
    paddingVertical: 12,
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
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  actionButton: {
    paddingHorizontal: 32,
  },
  privacyCard: {
    marginTop: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  privacyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  privacyIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyButton: {
    paddingHorizontal: 32,
  },
});
