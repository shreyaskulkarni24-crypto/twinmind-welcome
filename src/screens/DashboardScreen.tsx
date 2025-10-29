import React from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StarsBackground } from '../components/StarsBackground';
import { AIModeSwitch } from '../components/AIModeSwitch';// 🎯 ADD THIS LINE
import { useUser } from '../contexts/UserContext';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { userName } = useUser();

  const navigationItems = [
    {
      title: "Record",
      subtitle: "Capture your thoughts",
      screen: "Record",
      emoji: "🎤",
      color: "rgba(239, 68, 68, 0.2)",
    },
    {
      title: "Insights",
      subtitle: "View patterns & analysis",
      screen: "Insights",
      emoji: "🧠",
      color: "rgba(147, 51, 234, 0.2)",
    },
    {
      title: "Transcript",
      subtitle: "View recordings",
      screen: "Transcript", 
      emoji: "📝",
      color: "rgba(59, 130, 246, 0.2)",
    },
    {
      title: "Settings",
      subtitle: "Customize experience",
      screen: "Settings",
      emoji: "⚙️",
      color: "rgba(34, 197, 94, 0.2)",
    },
  ];

  const quickStats = [
    { label: "Recordings", value: "0", emoji: "📊" },
    { label: "Total Time", value: "0h", emoji: "⏱️" },
    { label: "Insights", value: "0", emoji: "✨" },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
      <StarsBackground />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoEmoji}>🧠</Text>
            </View>
          </View>
          <Text style={styles.title}>Twin Mind</Text>
          <Text style={styles.welcome}>
            Welcome back, <Text style={styles.userName}>{userName}</Text>!
          </Text>
          <Text style={styles.subtitle}>Ready to explore your thoughts?</Text>
        </View>

        {/* 🎯 ADD THIS LINE - AI Mode Switch */}
        <AIModeSwitch />

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          {quickStats.map((stat, index) => (
            <Card key={index} style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <Text style={styles.statEmoji}>{stat.emoji}</Text>
                <Text style={styles.statNumber}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </CardContent>
            </Card>
          ))}
        </View>

        {/* Navigation Items */}
        <View style={styles.navigationContainer}>
          {navigationItems.map((item, index) => (
            <Card key={index} style={styles.navCard}>
              <CardContent style={styles.navContent}>
                <View style={[styles.navIconContainer, { backgroundColor: item.color }]}>
                  <Text style={styles.navEmoji}>{item.emoji}</Text>
                </View>
                <View style={styles.navTextContainer}>
                  <Text style={styles.navTitle}>{item.title}</Text>
                  <Text style={styles.navSubtitle}>{item.subtitle}</Text>
                </View>
                <Button
                  title="Go"
                  onPress={() => navigation.navigate(item.screen)}
                  style={styles.navButton}
                />
              </CardContent>
            </Card>
          ))}
        </View>

        {/* Quick Action */}
        <Card style={styles.actionCard}>
          <CardContent style={styles.actionContent}>
            <Text style={styles.actionEmoji}>✨</Text>
            <Text style={styles.actionTitle}>Ready to record, {userName}?</Text>
            <Text style={styles.actionSubtitle}>
              Start capturing your thoughts and let AI discover patterns in your mind.
            </Text>
            <Button
              title="Start Recording"
              onPress={() => navigation.navigate('Record')}
              style={styles.actionButton}
            />
          </CardContent>
        </Card>

        {/* Insights Preview Card */}
        <Card style={styles.insightsPreviewCard}>
          <CardContent style={styles.insightsPreviewContent}>
            <Text style={styles.insightsPreviewEmoji}>🔍</Text>
            <Text style={styles.insightsPreviewTitle}>Discover Your Patterns</Text>
            <Text style={styles.insightsPreviewSubtitle}>
              Get AI-powered insights about your mood, topics, and thinking patterns.
            </Text>
            <Button
              title="View Insights"
              onPress={() => navigation.navigate('Insights')}
              variant="outline"
              style={styles.insightsPreviewButton}
            />
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  );
};

// Keep all your existing styles - no changes needed
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  welcome: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 4,
  },
  userName: {
    color: 'white',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  navigationContainer: {
    gap: 16,
    marginBottom: 32,
  },
  navCard: {
    marginBottom: 0,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  navIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  navEmoji: {
    fontSize: 28,
  },
  navTextContainer: {
    flex: 1,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  navSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    minHeight: 36,
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
  insightsPreviewCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    marginBottom: 24,
  },
  insightsPreviewContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  insightsPreviewEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  insightsPreviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
    textAlign: 'center',
  },
  insightsPreviewSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  insightsPreviewButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});
