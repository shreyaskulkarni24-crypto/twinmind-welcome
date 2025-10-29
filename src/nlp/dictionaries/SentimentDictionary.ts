/**
 * Offline Sentiment Analysis Dictionary
 * Uses curated word lists for local sentiment analysis
 * No external API calls - completely private
 */

export interface SentimentAnalysis {
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  label: 'positive' | 'negative' | 'neutral';
  breakdown: {
    positiveWords: string[];
    negativeWords: string[];
    intensifiers: string[];
    negators: string[];
  };
}

export class SentimentDictionary {
  private positiveWords: Set<string>;
  private negativeWords: Set<string>;
  private intensifiers: Set<string>;
  private negators: Set<string>;
  private positiveScores: Map<string, number>;
  private negativeScores: Map<string, number>;
  
  constructor() {
    console.log('📚 Loading local sentiment dictionaries...');
    this.initializeDictionaries();
    console.log('✅ Sentiment dictionaries loaded - 100% offline');
  }
  
  private initializeDictionaries(): void {
    // Positive Words Dictionary
    const positiveWordsList = [
      // Emotions & Feelings
      'happy', 'joy', 'excited', 'amazing', 'awesome', 'fantastic', 'wonderful',
      'great', 'excellent', 'perfect', 'brilliant', 'outstanding', 'superb',
      'delighted', 'thrilled', 'elated', 'cheerful', 'optimistic', 'confident',
      'proud', 'satisfied', 'grateful', 'blessed', 'lucky', 'fortunate',
      
      // Success & Achievement
      'success', 'achieve', 'accomplished', 'complete', 'finished', 'done',
      'won', 'victory', 'triumph', 'breakthrough', 'progress', 'improvement',
      'advance', 'growth', 'development', 'innovation', 'creative', 'productive',
      
      // Relationships & Social
      'love', 'friend', 'family', 'support', 'help', 'team', 'together',
      'connected', 'close', 'bond', 'trust', 'respect', 'appreciation',
      'kindness', 'generous', 'caring', 'compassionate', 'understanding',
      
      // Work & Professional
      'opportunity', 'promotion', 'raise', 'bonus', 'recognition', 'praise',
      'compliment', 'recommendation', 'approval', 'acceptance', 'hired',
      'qualified', 'skilled', 'expert', 'professional', 'capable',
      
      // Health & Energy
      'healthy', 'energetic', 'strong', 'fit', 'well', 'better', 'recovered',
      'refreshed', 'relaxed', 'calm', 'peaceful', 'centered', 'balanced',
      
      // General Positive
      'good', 'nice', 'fine', 'okay', 'alright', 'pleasant', 'smooth',
      'easy', 'simple', 'clear', 'bright', 'beautiful', 'lovely', 'pretty',
      'cool', 'interesting', 'fun', 'enjoyable', 'entertaining', 'engaging'
    ];
    
    // Negative Words Dictionary
    const negativeWordsList = [
      // Emotions & Feelings
      'sad', 'angry', 'frustrated', 'annoyed', 'upset', 'disappointed',
      'depressed', 'anxious', 'worried', 'stressed', 'overwhelmed', 'exhausted',
      'tired', 'bored', 'lonely', 'isolated', 'rejected', 'hurt', 'pain',
      'suffering', 'miserable', 'terrible', 'awful', 'horrible', 'disgusting',
      
      // Problems & Challenges
      'problem', 'issue', 'trouble', 'difficulty', 'struggle', 'challenge',
      'obstacle', 'barrier', 'setback', 'failure', 'mistake', 'error',
      'wrong', 'bad', 'worse', 'worst', 'failed', 'broken', 'damaged',
      
      // Work & Professional
      'fired', 'laid off', 'rejected', 'denied', 'refused', 'criticized',
      'complained', 'blamed', 'accused', 'punished', 'penalized', 'demoted',
      'overworked', 'underpaid', 'unfair', 'biased', 'discrimination',
      
      // Health & Physical
      'sick', 'ill', 'disease', 'injury', 'hurt', 'ache', 'sore', 'weak',
      'fatigue', 'nausea', 'fever', 'infection', 'allergic', 'chronic',
      
      // Relationships & Social
      'argument', 'fight', 'conflict', 'disagreement', 'breakup', 'divorce',
      'betrayed', 'cheated', 'lied', 'deceived', 'abandoned', 'ignored',
      'excluded', 'bullied', 'harassed', 'abused', 'threatened',
      
      // General Negative
      'hate', 'dislike', 'avoid', 'prevent', 'stop', 'quit', 'give up',
      'impossible', 'hopeless', 'useless', 'worthless', 'meaningless',
      'waste', 'loss', 'lose', 'lost', 'missing', 'gone', 'empty', 'nothing'
    ];
    
    // Intensifiers (boost sentiment strength)
    const intensifiersList = [
      'very', 'extremely', 'incredibly', 'amazingly', 'absolutely', 'completely',
      'totally', 'entirely', 'perfectly', 'fully', 'really', 'truly',
      'genuinely', 'seriously', 'definitely', 'certainly', 'surely',
      'quite', 'rather', 'pretty', 'fairly', 'somewhat', 'kind of',
      'super', 'mega', 'ultra', 'highly', 'deeply', 'strongly',
      'tremendously', 'enormously', 'immensely', 'exceptionally'
    ];
    
    // Negators (flip sentiment)
    const negatorsList = [
      'not', 'no', 'never', 'nothing', 'nobody', 'none', 'neither',
      'without', 'lack', 'lacking', 'missing', 'absent', 'void',
      "don't", "won't", "can't", "shouldn't", "wouldn't", "couldn't",
      "isn't", "aren't", "wasn't", "weren't", "hasn't", "haven't",
      "hadn't", "doesn't", "didn't", "barely", "hardly", "scarcely",
      'refuse', 'deny', 'reject', 'avoid', 'prevent', 'stop'
    ];
    
    // Convert to Sets for fast lookup
    this.positiveWords = new Set(positiveWordsList);
    this.negativeWords = new Set(negativeWordsList);
    this.intensifiers = new Set(intensifiersList);
    this.negators = new Set(negatorsList);
    
    // Create scoring maps
    this.positiveScores = new Map();
    this.negativeScores = new Map();
    
    // Assign scores to words (can be customized for domain-specific tuning)
    positiveWordsList.forEach(word => {
      if (['amazing', 'awesome', 'fantastic', 'excellent', 'perfect', 'brilliant'].includes(word)) {
        this.positiveScores.set(word, 0.8); // Strong positive
      } else if (['great', 'good', 'nice', 'happy', 'wonderful'].includes(word)) {
        this.positiveScores.set(word, 0.6); // Moderate positive
      } else {
        this.positiveScores.set(word, 0.4); // Mild positive
      }
    });
    
    negativeWordsList.forEach(word => {
      if (['terrible', 'awful', 'horrible', 'hate', 'disgusting'].includes(word)) {
        this.negativeScores.set(word, -0.8); // Strong negative
      } else if (['bad', 'sad', 'angry', 'problem', 'wrong'].includes(word)) {
        this.negativeScores.set(word, -0.6); // Moderate negative
      } else {
        this.negativeScores.set(word, -0.4); // Mild negative
      }
    });
  }
  
  /**
   * Comprehensive sentiment analysis
   */
  analyze(text: string, words: string[]): SentimentAnalysis {
    const lowerWords = words.map(w => w.toLowerCase());
    const breakdown = {
      positiveWords: [] as string[],
      negativeWords: [] as string[],
      intensifiers: [] as string[],
      negators: [] as string[]
    };
    
    let totalScore = 0;
    let sentimentWords = 0;
    
    // Process each word with context
    for (let i = 0; i < lowerWords.length; i++) {
      const word = lowerWords[i];
      const prevWord = i > 0 ? lowerWords[i - 1] : '';
      const nextWord = i < lowerWords.length - 1 ? lowerWords[i + 1] : '';
      
      // Check for intensifiers
      if (this.intensifiers.has(word)) {
        breakdown.intensifiers.push(word);
        continue;
      }
      
      // Check for negators
      if (this.negators.has(word)) {
        breakdown.negators.push(word);
        continue;
      }
      
      // Check sentiment words
      let wordScore = 0;
      let isNegated = false;
      
      if (this.positiveWords.has(word)) {
        wordScore = this.positiveScores.get(word) || 0.4;
        breakdown.positiveWords.push(word);
      } else if (this.negativeWords.has(word)) {
        wordScore = this.negativeScores.get(word) || -0.4;
        breakdown.negativeWords.push(word);
      }
      
      if (wordScore !== 0) {
        // Check for negation in context (2 words back)
        for (let j = Math.max(0, i - 2); j < i; j++) {
          if (this.negators.has(lowerWords[j])) {
            isNegated = true;
            break;
          }
        }
        
        // Check for intensifiers in context (1 word back/forward)
        let intensityMultiplier = 1.0;
        if (this.intensifiers.has(prevWord)) {
          intensityMultiplier = 1.3;
        }
        if (this.intensifiers.has(nextWord)) {
          intensityMultiplier = Math.max(intensityMultiplier, 1.2);
        }
        
        // Apply negation and intensity
        if (isNegated) {
          wordScore = -wordScore * 0.8; // Negation with slight dampening
        }
        wordScore *= intensityMultiplier;
        
        totalScore += wordScore;
        sentimentWords++;
      }
    }
    
    // Calculate final metrics
    const averageScore = sentimentWords > 0 ? totalScore / sentimentWords : 0;
    const normalizedScore = Math.max(-1, Math.min(1, averageScore));
    
    // Calculate confidence based on sentiment word density and consistency
    const wordDensity = sentimentWords / Math.max(1, words.length);
    const consistencyFactor = sentimentWords > 0 ? 
      Math.abs(totalScore) / sentimentWords : 0;
    
    const confidence = Math.min(0.95, wordDensity * 2 + consistencyFactor * 0.5);
    
    // Determine label
    let label: 'positive' | 'negative' | 'neutral';
    if (normalizedScore > 0.1) {
      label = 'positive';
    } else if (normalizedScore < -0.1) {
      label = 'negative';
    } else {
      label = 'neutral';
    }
    
    return {
      score: Number(normalizedScore.toFixed(3)),
      confidence: Number(confidence.toFixed(3)),
      label,
      breakdown
    };
  }
  
  /**
   * Quick sentiment analysis for real-time feedback
   */
  quickAnalyze(words: string[]): { label: 'positive' | 'negative' | 'neutral'; confidence: number } {
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (this.positiveWords.has(word.toLowerCase())) {
        positiveCount++;
      } else if (this.negativeWords.has(word.toLowerCase())) {
        negativeCount++;
      }
    });
    
    const totalSentiment = positiveCount + negativeCount;
    if (totalSentiment === 0) {
      return { label: 'neutral', confidence: 0 };
    }
    
    const positiveRatio = positiveCount / totalSentiment;
    const confidence = Math.min(0.9, totalSentiment / Math.max(1, words.length) * 2);
    
    if (positiveRatio > 0.6) {
      return { label: 'positive', confidence };
    } else if (positiveRatio < 0.4) {
      return { label: 'negative', confidence };
    } else {
      return { label: 'neutral', confidence };
    }
  }
  
  /**
   * Add custom words to dictionaries (for personalization)
   */
  addCustomWords(positive: string[] = [], negative: string[] = []): void {
    positive.forEach(word => {
      this.positiveWords.add(word.toLowerCase());
      this.positiveScores.set(word.toLowerCase(), 0.5);
    });
    
    negative.forEach(word => {
      this.negativeWords.add(word.toLowerCase());
      this.negativeScores.set(word.toLowerCase(), -0.5);
    });
    
    console.log(`Added ${positive.length} positive and ${negative.length} negative custom words`);
  }
  
  /**
   * Get dictionary size for stats
   */
  getSize(): number {
    return this.positiveWords.size + this.negativeWords.size + 
           this.intensifiers.size + this.negators.size;
  }
}