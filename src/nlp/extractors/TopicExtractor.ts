/**
 * Offline Topic Extraction
 * Uses keyword frequency analysis and categorization
 * No external APIs - completely local processing
 */

export interface TopicResult {
  primary: string[];
  secondary: string[];
  keywords: { word: string; frequency: number; relevance: number }[];
  categories: string[];
}

export class TopicExtractor {
  private stopWords: Set<string>;
  private topicCategories: Map<string, string[]>;
  private domainKeywords: Map<string, number>; // word -> base relevance score
  
  constructor() {
    console.log('🏷️ Loading topic extraction dictionaries...');
    this.initializeStopWords();
    this.initializeTopicCategories();
    this.initializeDomainKeywords();
    console.log('✅ Topic extraction ready - 100% offline');
  }
  
  private initializeStopWords(): void {
    // Common stop words that don't contribute to topic meaning
    const stopWordsList = [
      // Articles & Determiners
      'a', 'an', 'the', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
      
      // Pronouns
      'i', 'me', 'you', 'he', 'him', 'she', 'her', 'it', 'we', 'us', 'they', 'them', 'myself', 'yourself',
      
      // Prepositions
      'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further',
      
      // Conjunctions
      'and', 'or', 'but', 'if', 'then', 'because', 'as', 'until', 'while', 'of', 'to', 'from', 'since',
      
      // Common verbs (non-content)
      'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
      'did', 'doing', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall',
      
      // Common adverbs
      'very', 'really', 'quite', 'rather', 'just', 'only', 'also', 'too', 'so', 'now', 'then', 'here',
      'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
      'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'than', 'too', 'well',
      
      // Time/frequency words (unless contextually relevant)
      'today', 'tomorrow', 'yesterday', 'always', 'never', 'sometimes', 'often', 'usually', 'maybe',
      'perhaps', 'probably', 'definitely', 'certainly', 'surely'
    ];
    
    this.stopWords = new Set(stopWordsList);
  }
  
  private initializeTopicCategories(): void {
    this.topicCategories = new Map();
    
    // Work & Career
    this.topicCategories.set('work', [
      'work', 'job', 'career', 'office', 'meeting', 'project', 'task', 'deadline', 'team', 'manager',
      'boss', 'colleague', 'client', 'customer', 'presentation', 'report', 'proposal', 'budget',
      'strategy', 'planning', 'development', 'business', 'company', 'organization', 'department',
      'position', 'role', 'responsibility', 'skill', 'experience', 'training', 'conference',
      'interview', 'promotion', 'raise', 'bonus', 'performance', 'review', 'feedback', 'goal',
      'objective', 'target', 'achievement', 'success', 'failure', 'challenge', 'opportunity',
      'email', 'phone', 'call', 'communication', 'collaboration', 'teamwork', 'leadership',
      'management', 'administration', 'coordination', 'supervision', 'delegation', 'execution'
    ]);
    
    // Health & Wellness
    this.topicCategories.set('health', [
      'health', 'wellness', 'fitness', 'exercise', 'workout', 'gym', 'running', 'walking', 'sport',
      'yoga', 'meditation', 'diet', 'nutrition', 'food', 'eating', 'meal', 'cooking', 'recipe',
      'doctor', 'medical', 'appointment', 'checkup', 'treatment', 'medicine', 'medication',
      'hospital', 'clinic', 'therapy', 'counseling', 'mental', 'emotional', 'stress', 'anxiety',
      'depression', 'mood', 'feeling', 'energy', 'sleep', 'rest', 'relaxation', 'recovery',
      'injury', 'pain', 'ache', 'sick', 'illness', 'disease', 'condition', 'symptom',
      'weight', 'muscle', 'strength', 'cardio', 'flexibility', 'balance', 'coordination',
      'breathing', 'heart', 'blood', 'pressure', 'cholesterol', 'diabetes', 'allergy'
    ]);
    
    // Relationships & Social
    this.topicCategories.set('relationships', [
      'family', 'friend', 'relationship', 'partner', 'spouse', 'marriage', 'dating', 'love',
      'romance', 'friendship', 'social', 'party', 'gathering', 'event', 'celebration',
      'communication', 'conversation', 'discussion', 'argument', 'conflict', 'agreement',
      'support', 'help', 'advice', 'guidance', 'understanding', 'empathy', 'compassion',
      'trust', 'respect', 'loyalty', 'commitment', 'bond', 'connection', 'intimacy',
      'parent', 'child', 'son', 'daughter', 'mother', 'father', 'brother', 'sister',
      'grandparent', 'uncle', 'aunt', 'cousin', 'neighbor', 'community', 'group',
      'club', 'organization', 'network', 'contact', 'acquaintance', 'colleague'
    ]);
    
    // Personal Development
    this.topicCategories.set('personal_development', [
      'learning', 'education', 'study', 'course', 'class', 'training', 'skill', 'knowledge',
      'growth', 'development', 'improvement', 'progress', 'achievement', 'goal', 'objective',
      'plan', 'strategy', 'vision', 'dream', 'aspiration', 'ambition', 'motivation',
      'inspiration', 'creativity', 'innovation', 'thinking', 'reflection', 'contemplation',
      'mindfulness', 'awareness', 'consciousness', 'spirituality', 'philosophy', 'wisdom',
      'book', 'reading', 'writing', 'journal', 'diary', 'note', 'idea', 'thought',
      'concept', 'theory', 'practice', 'habit', 'routine', 'discipline', 'consistency',
      'challenge', 'opportunity', 'experience', 'adventure', 'exploration', 'discovery'
    ]);
    
    // Finance & Money
    this.topicCategories.set('finance', [
      'money', 'finance', 'financial', 'budget', 'expense', 'cost', 'price', 'payment',
      'salary', 'income', 'earning', 'profit', 'loss', 'saving', 'spending', 'investment',
      'stock', 'bond', 'portfolio', 'retirement', 'pension', 'insurance', 'tax', 'debt',
      'loan', 'mortgage', 'credit', 'banking', 'account', 'transaction', 'purchase',
      'buy', 'sell', 'trade', 'market', 'economy', 'inflation', 'recession', 'growth',
      'wealth', 'rich', 'poor', 'expensive', 'cheap', 'affordable', 'valuable', 'worth'
    ]);
    
    // Technology
    this.topicCategories.set('technology', [
      'technology', 'computer', 'laptop', 'desktop', 'phone', 'mobile', 'smartphone', 'tablet',
      'software', 'application', 'app', 'program', 'system', 'platform', 'website', 'internet',
      'online', 'digital', 'electronic', 'device', 'gadget', 'tool', 'equipment', 'hardware',
      'network', 'connection', 'wireless', 'bluetooth', 'wifi', 'data', 'information',
      'database', 'server', 'cloud', 'storage', 'backup', 'security', 'privacy', 'encryption',
      'coding', 'programming', 'development', 'design', 'interface', 'user', 'experience',
      'artificial', 'intelligence', 'machine', 'learning', 'automation', 'robot', 'smart'
    ]);
    
    // Home & Living
    this.topicCategories.set('home', [
      'home', 'house', 'apartment', 'room', 'bedroom', 'kitchen', 'bathroom', 'living',
      'dining', 'office', 'garage', 'garden', 'yard', 'furniture', 'decoration', 'design',
      'renovation', 'repair', 'maintenance', 'cleaning', 'organization', 'storage',
      'appliance', 'electric', 'plumbing', 'heating', 'cooling', 'lighting', 'security',
      'neighborhood', 'location', 'address', 'rent', 'mortgage', 'property', 'real estate',
      'moving', 'packing', 'unpacking', 'settling', 'comfort', 'cozy', 'spacious', 'modern'
    ]);
    
    // Travel & Recreation
    this.topicCategories.set('travel', [
      'travel', 'trip', 'vacation', 'holiday', 'journey', 'adventure', 'exploration', 'tour',
      'destination', 'location', 'place', 'city', 'country', 'continent', 'culture', 'local',
      'flight', 'plane', 'airport', 'hotel', 'accommodation', 'booking', 'reservation',
      'restaurant', 'food', 'cuisine', 'sightseeing', 'attraction', 'museum', 'park',
      'beach', 'mountain', 'nature', 'landscape', 'scenery', 'photo', 'memory', 'experience',
      'recreation', 'entertainment', 'fun', 'hobby', 'interest', 'passion', 'activity',
      'sport', 'game', 'music', 'movie', 'book', 'art', 'creativity', 'relaxation'
    ]);
  }
  
  private initializeDomainKeywords(): void {
    this.domainKeywords = new Map();
    
    // Add domain-specific keywords with base relevance scores
    const domainWords = [
      // Emotional/psychological terms
      { words: ['feel', 'feeling', 'emotion', 'mood', 'think', 'thought', 'mind', 'mental'], score: 0.8 },
      
      // Action/productivity terms
      { words: ['plan', 'goal', 'objective', 'task', 'project', 'work', 'complete', 'finish'], score: 0.7 },
      
      // Time/scheduling terms
      { words: ['time', 'schedule', 'calendar', 'deadline', 'urgent', 'priority', 'important'], score: 0.6 },
      
      // Learning/growth terms
      { words: ['learn', 'study', 'practice', 'skill', 'knowledge', 'improve', 'develop', 'grow'], score: 0.7 },
      
      // Problem/solution terms
      { words: ['problem', 'issue', 'challenge', 'solution', 'fix', 'solve', 'resolve', 'handle'], score: 0.8 },
      
      // Relationship terms
      { words: ['family', 'friend', 'colleague', 'team', 'partner', 'relationship', 'communication'], score: 0.6 }
    ];
    
    domainWords.forEach(({ words, score }) => {
      words.forEach(word => {
        this.domainKeywords.set(word, score);
      });
    });
  }
  
  /**
   * Extract topics from text using frequency analysis
   */
  extract(text: string, words: string[]): TopicResult {
    console.log('🔍 Extracting topics using frequency analysis...');
    
    // Get word frequencies
    const wordFreq = this.calculateWordFrequencies(words);
    
    // Calculate relevance scores
    const keywordScores = this.calculateRelevanceScores(wordFreq, text);
    
    // Categorize topics
    const categories = this.categorizeTopics(keywordScores);
    
    // Extract primary and secondary topics
    const { primary, secondary } = this.extractTopicHierarchy(keywordScores, categories);
    
    console.log(`✅ Extracted ${primary.length} primary and ${secondary.length} secondary topics`);
    
    return {
      primary,
      secondary,
      keywords: keywordScores.slice(0, 15), // Top 15 keywords
      categories: Array.from(categories.keys()).slice(0, 5) // Top 5 categories
    };
  }
  
  private calculateWordFrequencies(words: string[]): Map<string, number> {
    const freq = new Map<string, number>();
    const cleanWords = words
      .map(word => word.toLowerCase().replace(/[^\w]/g, ''))
      .filter(word => 
        word.length > 2 && // Minimum length
        word.length < 20 && // Maximum length
        !this.stopWords.has(word) && // Not a stop word
        !/^\d+$/.test(word) // Not just numbers
      );
    
    cleanWords.forEach(word => {
      freq.set(word, (freq.get(word) || 0) + 1);
    });
    
    return freq;
  }
  
  private calculateRelevanceScores(wordFreq: Map<string, number>, text: string): 
    { word: string; frequency: number; relevance: number }[] {
    
    const totalWords = Array.from(wordFreq.values()).reduce((sum, freq) => sum + freq, 0);
    const maxFreq = Math.max(...Array.from(wordFreq.values()));
    
    const scored = Array.from(wordFreq.entries()).map(([word, frequency]) => {
      // Normalize frequency (0-1)
      const normalizedFreq = frequency / maxFreq;
      
      // Get domain relevance
      const domainScore = this.domainKeywords.get(word) || 0.3;
      
      // Length bonus (longer words often more meaningful)
      const lengthBonus = Math.min(0.3, (word.length - 3) * 0.05);
      
      // Position bonus (words appearing early/late in text)
      const firstIndex = text.toLowerCase().indexOf(word);
      const lastIndex = text.toLowerCase().lastIndexOf(word);
      const textLength = text.length;
      const positionBonus = (firstIndex < textLength * 0.2 || lastIndex > textLength * 0.8) ? 0.1 : 0;
      
      // Calculate final relevance score
      const relevance = (normalizedFreq * 0.4) + (domainScore * 0.4) + lengthBonus + positionBonus;
      
      return {
        word,
        frequency,
        relevance: Number(relevance.toFixed(3))
      };
    });
    
    // Sort by relevance score
    return scored
      .sort((a, b) => b.relevance - a.relevance)
      .filter(item => item.relevance > 0.2); // Filter out low-relevance words
  }
  
  private categorizeTopics(keywords: { word: string; frequency: number; relevance: number }[]): 
    Map<string, number> {
    
    const categoryScores = new Map<string, number>();
    
    // Score each category based on keyword matches
    for (const [category, categoryWords] of this.topicCategories.entries()) {
      let score = 0;
      
      keywords.forEach(({ word, relevance }) => {
        if (categoryWords.includes(word.toLowerCase())) {
          score += relevance;
        }
        
        // Check for partial matches (stemming-like approach)
        categoryWords.forEach(categoryWord => {
          if (word.includes(categoryWord) || categoryWord.includes(word)) {
            score += relevance * 0.5; // Lower score for partial matches
          }
        });
      });
      
      if (score > 0) {
        categoryScores.set(category, score);
      }
    }
    
    // Sort categories by score
    return new Map([...categoryScores.entries()].sort(([,a], [,b]) => b - a));
  }
  
  private extractTopicHierarchy(
    keywords: { word: string; frequency: number; relevance: number }[], 
    categories: Map<string, number>
  ): { primary: string[], secondary: string[] } {
    
    // Primary topics: top-scoring keywords and categories
    const primaryKeywords = keywords
      .slice(0, 5)
      .filter(k => k.relevance > 0.5)
      .map(k => k.word);
    
    const primaryCategories = Array.from(categories.keys()).slice(0, 2);
    const primary = [...new Set([...primaryKeywords, ...primaryCategories])];
    
    // Secondary topics: medium-scoring keywords and remaining categories
    const secondaryKeywords = keywords
      .slice(5, 10)
      .filter(k => k.relevance > 0.3)
      .map(k => k.word);
    
    const secondaryCategories = Array.from(categories.keys()).slice(2, 4);
    const secondary = [...new Set([...secondaryKeywords, ...secondaryCategories])]
      .filter(topic => !primary.includes(topic));
    
    return { primary, secondary };
  }
  
  /**
   * Quick topic analysis for real-time feedback
   */
  quickAnalyze(words: string[]): { topics: string[]; confidence: number } {
    const wordFreq = this.calculateWordFrequencies(words);
    const topWords = Array.from(wordFreq.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
    
    const confidence = Math.min(0.9, topWords.length * 0.15);
    
    return {
      topics: topWords,
      confidence: Number(confidence.toFixed(2))
    };
  }
  
  /**
   * Get category count for stats
   */
  getCategoryCount(): number {
    return this.topicCategories.size;
  }
  
  /**
   * Add custom topic category
   */
  addCustomCategory(name: string, keywords: string[]): void {
    this.topicCategories.set(name, keywords);
    console.log(`Added custom topic category: ${name} with ${keywords.length} keywords`);
  }
  
  /**
   * Get all available categories
   */
  getCategories(): string[] {
    return Array.from(this.topicCategories.keys());
  }
}