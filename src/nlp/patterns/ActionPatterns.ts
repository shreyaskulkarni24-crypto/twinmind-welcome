/**
 * Offline Action Item Detection
 * Uses regex patterns to identify actionable items
 * No external services - completely local processing
 */

export interface ActionItem {
  text: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  confidence: number;
  deadline?: string;
  context: string;
}

export interface ActionDetectionResult {
  items: string[];
  patterns: {
    pattern: string;
    matches: string[];
    priority: 'high' | 'medium' | 'low';
  }[];
  totalCount: number;
}

export class ActionPatterns {
  private patterns: Map<string, {
    regex: RegExp;
    priority: 'high' | 'medium' | 'low';
    category: string;
    description: string;
  }>;
  
  constructor() {
    console.log('🎯 Loading action item detection patterns...');
    this.initializePatterns();
    console.log('✅ Action patterns loaded - ready for local detection');
  }
  
  private initializePatterns(): void {
    this.patterns = new Map();
    
    // High Priority Action Patterns
    this.addPattern('urgent_tasks', {
      regex: /(?:urgent|asap|immediately|right away|emergency|critical|must do)\s+.{1,100}(?:\.|!|$)/gi,
      priority: 'high',
      category: 'urgent',
      description: 'Urgent tasks requiring immediate attention'
    });
    
    this.addPattern('deadline_tasks', {
      regex: /(?:due|deadline|by|before|until)\s+(?:today|tomorrow|this week|next week|\d{1,2}[\/\-]\d{1,2}|\w+day).{0,100}(?:\.|!|$)/gi,
      priority: 'high',
      category: 'deadline',
      description: 'Tasks with specific deadlines'
    });
    
    this.addPattern('need_to_actions', {
      regex: /(?:need to|have to|must|should|got to)\s+(?:do|complete|finish|start|begin|work on|handle|take care of|deal with)\s+.{1,80}(?:\.|!|$)/gi,
      priority: 'high',
      category: 'obligation',
      description: 'Tasks with strong obligation language'
    });
    
    // Medium Priority Action Patterns
    this.addPattern('todo_items', {
      regex: /(?:to do|todo|task|action item):\s*.{1,100}(?:\.|!|$)/gi,
      priority: 'medium',
      category: 'todo',
      description: 'Explicit todo items'
    });
    
    this.addPattern('planning_actions', {
      regex: /(?:plan to|planning to|going to|will|intend to)\s+(?:do|make|create|build|write|call|email|meet|visit|buy|get|start|finish).{0,80}(?:\.|!|$)/gi,
      priority: 'medium',
      category: 'planning',
      description: 'Planned future actions'
    });
    
    this.addPattern('meeting_actions', {
      regex: /(?:schedule|arrange|set up|book)\s+(?:a|an)?\s*(?:meeting|call|appointment|session)\s+(?:with|for).{0,60}(?:\.|!|$)/gi,
      priority: 'medium',
      category: 'meeting',
      description: 'Meeting and appointment scheduling'
    });
    
    this.addPattern('communication_actions', {
      regex: /(?:call|email|text|message|contact|reach out to|follow up with)\s+.{1,50}(?:\.|!|$)/gi,
      priority: 'medium',
      category: 'communication',
      description: 'Communication tasks'
    });
    
    this.addPattern('research_actions', {
      regex: /(?:research|look up|find out|investigate|explore|study|learn about)\s+.{1,60}(?:\.|!|$)/gi,
      priority: 'medium',
      category: 'research',
      description: 'Research and information gathering'
    });
    
    // Low Priority Action Patterns
    this.addPattern('consideration_actions', {
      regex: /(?:think about|consider|maybe|might|could|possibly)\s+(?:doing|making|getting|trying).{0,60}(?:\.|!|$)/gi,
      priority: 'low',
      category: 'consideration',
      description: 'Items for consideration or future thought'
    });
    
    this.addPattern('want_actions', {
      regex: /(?:want to|would like to|wish to|hope to)\s+(?:do|make|get|try|start|learn|buy|visit).{0,60}(?:\.|!|$)/gi,
      priority: 'low',
      category: 'aspiration',
      description: 'Aspirational actions and wants'
    });
    
    this.addPattern('someday_actions', {
      regex: /(?:someday|eventually|one day|in the future|when I have time)\s*.{1,60}(?:\.|!|$)/gi,
      priority: 'low',
      category: 'someday',
      description: 'Future or someday actions'
    });
    
    // Specific Action Verbs (Medium Priority)
    this.addPattern('action_verbs', {
      regex: /\b(?:buy|purchase|get|acquire|obtain|order|book|reserve|schedule|organize|clean|fix|repair|update|upgrade|install|download|backup|review|check|verify|confirm|submit|send|deliver|complete|finish|start|begin|create|make|build|write|draft|prepare|practice|exercise|workout|study|read|watch|listen|attend|visit|go to|travel|move|relocate|apply|register|sign up|cancel|delete|remove|sell|donate|give away|throw away|declutter|sort|file|archive)\s+.{1,60}(?:\.|!|$)/gi,
      priority: 'medium',
      category: 'action',
      description: 'Sentences containing clear action verbs'
    });
    
    // Question-based Actions
    this.addPattern('question_actions', {
      regex: /(?:should I|what if I|how about|what about)\s+(?:do|make|get|try|start).{0,50}\?/gi,
      priority: 'low',
      category: 'question',
      description: 'Action-oriented questions'
    });
    
    // Time-based Actions
    this.addPattern('time_actions', {
      regex: /(?:this week|next week|this month|next month|today|tomorrow|later|soon)\s+(?:I|we|they)?\s*(?:will|need to|should|must|have to|going to)\s+.{1,60}(?:\.|!|$)/gi,
      priority: 'medium',
      category: 'scheduled',
      description: 'Time-specific actions'
    });
    
    // Work/Professional Actions
    this.addPattern('work_actions', {
      regex: /(?:work on|project|assignment|report|presentation|proposal|document|spreadsheet|analysis|review|meeting|client|customer|team|manager|boss|deadline|budget|proposal|contract|deal|sale|marketing|strategy).{0,80}(?:\.|!|$)/gi,
      priority: 'medium',
      category: 'work',
      description: 'Work and professional actions'
    });
    
    // Personal/Life Actions
    this.addPattern('personal_actions', {
      regex: /(?:health|doctor|appointment|exercise|gym|diet|family|friend|home|house|car|maintenance|bills|finance|insurance|vacation|travel|hobby|learn|skill|course|class).{0,60}(?:\.|!|$)/gi,
      priority: 'medium',
      category: 'personal',
      description: 'Personal life actions'
    });
  }
  
  private addPattern(name: string, config: {
    regex: RegExp;
    priority: 'high' | 'medium' | 'low';
    category: string;
    description: string;
  }): void {
    this.patterns.set(name, config);
  }
  
  /**
   * Detect action items in text using pattern matching
   */
  detect(text: string, sentences: string[]): ActionDetectionResult {
    const allMatches: string[] = [];
    const patternResults: {
      pattern: string;
      matches: string[];
      priority: 'high' | 'medium' | 'low';
    }[] = [];
    
    console.log(`🔍 Scanning text for action items using ${this.patterns.size} patterns...`);
    
    // Process each pattern
    for (const [patternName, config] of this.patterns.entries()) {
      const matches = this.findMatches(text, config.regex);
      
      if (matches.length > 0) {
        // Clean and deduplicate matches
        const cleanMatches = matches
          .map(match => this.cleanMatch(match))
          .filter((match, index, arr) => 
            match.length > 10 && // Minimum length check
            match.length < 200 && // Maximum length check
            arr.indexOf(match) === index // Remove duplicates
          );
        
        if (cleanMatches.length > 0) {
          patternResults.push({
            pattern: patternName,
            matches: cleanMatches,
            priority: config.priority
          });
          
          allMatches.push(...cleanMatches);
        }
      }
    }
    
    // Remove duplicate items across patterns
    const uniqueItems = Array.from(new Set(allMatches));
    
    // Sort by priority and confidence
    const sortedItems = this.prioritizeItems(uniqueItems, patternResults);
    
    console.log(`✅ Found ${uniqueItems.length} potential action items`);
    
    return {
      items: sortedItems,
      patterns: patternResults,
      totalCount: uniqueItems.length
    };
  }
  
  private findMatches(text: string, regex: RegExp): string[] {
    const matches: string[] = [];
    let match;
    
    // Reset regex to avoid issues with global flag
    regex.lastIndex = 0;
    
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[0]);
    }
    
    return matches;
  }
  
  private cleanMatch(match: string): string {
    return match
      .trim()
      .replace(/^\W+/, '') // Remove leading non-word characters
      .replace(/\W+$/, '') // Remove trailing non-word characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .toLowerCase()
      .replace(/^(i|we|you|they|he|she|it)\s+/, '') // Remove leading pronouns
      .trim();
  }
  
  private prioritizeItems(items: string[], patterns: any[]): string[] {
    // Create priority map
    const priorityScores = new Map<string, number>();
    
    patterns.forEach(pattern => {
      const score = pattern.priority === 'high' ? 3 : 
                   pattern.priority === 'medium' ? 2 : 1;
      
      pattern.matches.forEach((match: string) => {
        const current = priorityScores.get(match) || 0;
        priorityScores.set(match, Math.max(current, score));
      });
    });
    
    // Sort by priority score, then by length (longer = more specific)
    return items.sort((a, b) => {
      const scoreA = priorityScores.get(a) || 0;
      const scoreB = priorityScores.get(b) || 0;
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Higher priority first
      }
      
      return b.length - a.length; // Longer items first for same priority
    });
  }
  
  /**
   * Quick check if text contains action items
   */
  hasActionItems(text: string): { hasActions: boolean; confidence: number; count: number } {
    let totalMatches = 0;
    let highPriorityMatches = 0;
    
    for (const [_, config] of this.patterns.entries()) {
      const matches = this.findMatches(text, config.regex);
      totalMatches += matches.length;
      
      if (config.priority === 'high') {
        highPriorityMatches += matches.length;
      }
    }
    
    const hasActions = totalMatches > 0;
    const confidence = Math.min(0.95, (totalMatches * 0.3) + (highPriorityMatches * 0.5));
    
    return {
      hasActions,
      confidence: Number(confidence.toFixed(2)),
      count: totalMatches
    };
  }
  
  /**
   * Get pattern statistics
   */
  getPatternCount(): number {
    return this.patterns.size;
  }
  
  /**
   * Add custom pattern for domain-specific detection
   */
  addCustomPattern(name: string, config: {
    regex: RegExp;
    priority: 'high' | 'medium' | 'low';
    category: string;
    description: string;
  }): void {
    this.patterns.set(`custom_${name}`, config);
    console.log(`Added custom action pattern: ${name}`);
  }
  
  /**
   * Get all pattern categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    for (const [_, config] of this.patterns.entries()) {
      categories.add(config.category);
    }
    return Array.from(categories);
  }
}