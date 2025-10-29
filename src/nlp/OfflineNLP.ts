/**
 * TwinMind Offline NLP Engine
 * 100% Local Processing - No Data Leaves Device
 * Privacy-First Approach Like Whisper STT
 */

import { SentimentDictionary } from './dictionaries/SentimentDictionary';
import { ActionPatterns } from './patterns/ActionPatterns';
import { TopicExtractor } from './extractors/TopicExtractor';
import { InsightGenerator } from './generators/InsightGenerator';
import { TextPreprocessor } from './utils/TextPreprocessor';

export interface NLPResult {
  // Core Analysis
  originalText: string;
  processedText: string;
  wordCount: number;
  sentenceCount: number;
  
  // Sentiment Analysis
  sentiment: {
    score: number; // -1 to 1 (negative to positive)
    confidence: number; // 0 to 1
    label: 'positive' | 'negative' | 'neutral';
    breakdown: {
      positiveWords: string[];
      negativeWords: string[];
      intensifiers: string[];
      negators: string[];
    };
  };
  
  // Action Items
  actionItems: {
    items: string[];
    patterns: {
      pattern: string;
      matches: string[];
      priority: 'high' | 'medium' | 'low';
    }[];
    totalCount: number;
  };
  
  // Topic Extraction
  topics: {
    primary: string[];
    secondary: string[];
    keywords: { word: string; frequency: number; relevance: number }[];
    categories: string[];
  };
  
  // Insights
  insights: {
    mood: 'positive' | 'negative' | 'neutral' | 'excited' | 'concerned' | 'thoughtful';
    energy: 'high' | 'medium' | 'low';
    focus: 'clear' | 'scattered' | 'mixed';
    recommendations: string[];
    patterns: string[];
  };
  
  // Metadata
  processingTime: number;
  timestamp: string;
  privacy: {
    dataProcessedLocally: true;
    noExternalCalls: true;
    noDataStored: boolean;
  };
}

export class OfflineNLP {
  private sentimentDictionary: SentimentDictionary;
  private actionPatterns: ActionPatterns;
  private topicExtractor: TopicExtractor;
  private insightGenerator: InsightGenerator;
  private textPreprocessor: TextPreprocessor;
  
  constructor() {
    console.log('🔒 Initializing TwinMind Offline NLP Engine...');
    
    // Initialize all components
    this.sentimentDictionary = new SentimentDictionary();
    this.actionPatterns = new ActionPatterns();
    this.topicExtractor = new TopicExtractor();
    this.insightGenerator = new InsightGenerator();
    this.textPreprocessor = new TextPreprocessor();
    
    console.log('✅ Offline NLP Engine Ready - 100% Private & Local');
  }
  
  /**
   * Main NLP Processing Function
   * Processes text completely offline with no external calls
   */
  async processText(text: string, options?: {
    skipSentiment?: boolean;
    skipActionItems?: boolean;
    skipTopics?: boolean;
    skipInsights?: boolean;
    storeResults?: boolean;
  }): Promise<NLPResult> {
    const startTime = Date.now();
    
    console.log('🧠 Processing text locally (length:', text.length, 'chars)');
    
    // Preprocess text
    const processedText = this.textPreprocessor.clean(text);
    const sentences = this.textPreprocessor.splitSentences(processedText);
    const words = this.textPreprocessor.tokenize(processedText);
    
    // Initialize result structure
    const result: NLPResult = {
      originalText: text,
      processedText,
      wordCount: words.length,
      sentenceCount: sentences.length,
      sentiment: {
        score: 0,
        confidence: 0,
        label: 'neutral',
        breakdown: {
          positiveWords: [],
          negativeWords: [],
          intensifiers: [],
          negators: []
        }
      },
      actionItems: {
        items: [],
        patterns: [],
        totalCount: 0
      },
      topics: {
        primary: [],
        secondary: [],
        keywords: [],
        categories: []
      },
      insights: {
        mood: 'neutral',
        energy: 'medium',
        focus: 'mixed',
        recommendations: [],
        patterns: []
      },
      processingTime: 0,
      timestamp: new Date().toISOString(),
      privacy: {
        dataProcessedLocally: true,
        noExternalCalls: true,
        noDataStored: options?.storeResults !== true
      }
    };
    
    try {
      // 1. Sentiment Analysis (Dictionary-based)
      if (!options?.skipSentiment) {
        console.log('📊 Analyzing sentiment locally...');
        result.sentiment = await this.analyzeSentiment(processedText, words);
      }
      
      // 2. Action Item Detection (Regex-based)
      if (!options?.skipActionItems) {
        console.log('✅ Detecting action items locally...');
        result.actionItems = await this.detectActionItems(processedText, sentences);
      }
      
      // 3. Topic Extraction (Frequency-based)
      if (!options?.skipTopics) {
        console.log('🏷️ Extracting topics locally...');
        result.topics = await this.extractTopics(processedText, words);
      }
      
      // 4. Insight Generation (Rule-based)
      if (!options?.skipInsights) {
        console.log('💡 Generating insights locally...');
        result.insights = await this.generateInsights(result);
      }
      
      const processingTime = Date.now() - startTime;
      result.processingTime = processingTime;
      
      console.log(`✨ Local NLP processing complete in ${processingTime}ms`);
      console.log('🔒 All processing done on-device - no data transmitted');
      
      return result;
      
    } catch (error) {
      console.error('❌ Offline NLP processing error:', error);
      
      // Return safe fallback result
      result.processingTime = Date.now() - startTime;
      result.insights.recommendations = [
        'Text processed locally with basic analysis',
        'All processing completed on your device',
        'Your privacy is fully protected'
      ];
      
      return result;
    }
  }
  
  /**
   * Dictionary-based Sentiment Analysis
   * Uses local word dictionaries - no API calls
   */
  private async analyzeSentiment(text: string, words: string[]): Promise<NLPResult['sentiment']> {
    return this.sentimentDictionary.analyze(text, words);
  }
  
  /**
   * Regex-based Action Item Detection
   * Uses pattern matching - completely offline
   */
  private async detectActionItems(text: string, sentences: string[]): Promise<NLPResult['actionItems']> {
    return this.actionPatterns.detect(text, sentences);
  }
  
  /**
   * Keyword Frequency Topic Extraction
   * Statistical analysis - no external services
   */
  private async extractTopics(text: string, words: string[]): Promise<NLPResult['topics']> {
    return this.topicExtractor.extract(text, words);
  }
  
  /**
   * Rule-based Insight Generation
   * Logic-based insights - completely local
   */
  private async generateInsights(nlpResult: Partial<NLPResult>): Promise<NLPResult['insights']> {
    return this.insightGenerator.generate(nlpResult);
  }
  
  /**
   * Quick sentiment check for real-time feedback
   */
  quickSentiment(text: string): { label: string; confidence: number; emoji: string } {
    if (!text.trim()) return { label: 'neutral', confidence: 0, emoji: '😐' };
    
    const words = this.textPreprocessor.tokenize(text.toLowerCase());
    const sentiment = this.sentimentDictionary.quickAnalyze(words);
    
    return {
      label: sentiment.label,
      confidence: sentiment.confidence,
      emoji: sentiment.label === 'positive' ? '😊' : 
             sentiment.label === 'negative' ? '😔' : '😐'
    };
  }
  
  /**
   * Get processing statistics
   */
  getStats(): {
    dictionarySize: number;
    patternCount: number;
    topicCategories: number;
    isReady: boolean;
    privacy: string;
  } {
    return {
      dictionarySize: this.sentimentDictionary.getSize(),
      patternCount: this.actionPatterns.getPatternCount(),
      topicCategories: this.topicExtractor.getCategoryCount(),
      isReady: true,
      privacy: '100% Local Processing - No Data Transmitted'
    };
  }
}

// Export singleton instance
export const offlineNLP = new OfflineNLP();