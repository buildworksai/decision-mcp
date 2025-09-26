import { z } from 'zod';

// NLP Analysis schemas
const KeywordAnalysisSchema = z.object({
  keywords: z.array(z.object({
    word: z.string(),
    frequency: z.number(),
    importance: z.number()
  })),
  keyPhrases: z.array(z.string()),
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  confidence: z.number().min(0).max(1)
});

const SummarySchema = z.object({
  summary: z.string(),
  keyPoints: z.array(z.string()),
  wordCount: z.number(),
  compressionRatio: z.number()
});

const SimilarityAnalysisSchema = z.object({
  similarity: z.number().min(0).max(1),
  commonWords: z.array(z.string()),
  differences: z.array(z.string())
});

export type KeywordAnalysis = z.infer<typeof KeywordAnalysisSchema>;
export type Summary = z.infer<typeof SummarySchema>;
export type SimilarityAnalysis = z.infer<typeof SimilarityAnalysisSchema>;

export class NLPService {
  private stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these',
    'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
  ]);

  private positiveWords = new Set([
    'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'outstanding',
    'positive', 'beneficial', 'advantageous', 'successful', 'effective', 'efficient',
    'improved', 'better', 'best', 'optimal', 'ideal', 'perfect', 'superior'
  ]);

  private negativeWords = new Set([
    'bad', 'terrible', 'awful', 'horrible', 'negative', 'harmful', 'detrimental',
    'unsuccessful', 'ineffective', 'inefficient', 'worse', 'worst', 'poor',
    'failed', 'failure', 'problem', 'issue', 'concern', 'risk', 'danger'
  ]);

  /**
   * Extract keywords and analyze text
   */
  analyzeKeywords(text: string): KeywordAnalysis {
    const words = this.tokenize(text);
    const wordFreq = new Map<string, number>();
    
    // Count word frequencies
    words.forEach(word => {
      if (!this.stopWords.has(word.toLowerCase()) && word.length > 2) {
        wordFreq.set(word.toLowerCase(), (wordFreq.get(word.toLowerCase()) || 0) + 1);
      }
    });

    // Calculate importance scores (TF-IDF simplified)
    const totalWords = words.length;
    const keywords = Array.from(wordFreq.entries())
      .map(([word, frequency]) => ({
        word,
        frequency,
        importance: frequency / totalWords
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 20);

    // Extract key phrases (simple n-gram approach)
    const keyPhrases = this.extractKeyPhrases(text);

    // Analyze sentiment
    const sentiment = this.analyzeSentiment(text);

    return {
      keywords,
      keyPhrases,
      sentiment: sentiment.sentiment,
      confidence: sentiment.confidence
    };
  }

  /**
   * Generate text summary
   */
  generateSummary(text: string, maxLength: number = 200): Summary {
    const sentences = this.splitIntoSentences(text);
    const wordCount = this.tokenize(text).length;
    
    if (sentences.length <= 2) {
      return {
        summary: text,
        keyPoints: sentences,
        wordCount,
        compressionRatio: 1
      };
    }

    // Simple extractive summarization
    const sentenceScores = sentences.map(sentence => ({
      sentence,
      score: this.calculateSentenceScore(sentence, text)
    }));

    sentenceScores.sort((a, b) => b.score - a.score);

    // Select top sentences until we reach max length
    const selectedSentences: string[] = [];
    let currentLength = 0;

    for (const { sentence } of sentenceScores) {
      if (currentLength + sentence.length <= maxLength) {
        selectedSentences.push(sentence);
        currentLength += sentence.length;
      }
    }

    // Maintain original order
    const orderedSentences = sentences.filter(s => selectedSentences.includes(s));
    const summary = orderedSentences.join(' ');

    return {
      summary,
      keyPoints: selectedSentences,
      wordCount,
      compressionRatio: summary.length / text.length
    };
  }

  /**
   * Analyze similarity between two texts
   */
  analyzeSimilarity(text1: string, text2: string): SimilarityAnalysis {
    const words1 = new Set(this.tokenize(text1).map(w => w.toLowerCase()));
    const words2 = new Set(this.tokenize(text2).map(w => w.toLowerCase()));

    // Calculate Jaccard similarity
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    const similarity = intersection.size / union.size;

    const commonWords = Array.from(intersection).slice(0, 10);
    const differences = [
      ...Array.from(words1).filter(x => !words2.has(x)).slice(0, 5),
      ...Array.from(words2).filter(x => !words1.has(x)).slice(0, 5)
    ];

    return {
      similarity,
      commonWords,
      differences
    };
  }

  /**
   * Extract entities (simplified NER)
   */
  extractEntities(text: string): Array<{ text: string; type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'DATE' | 'MONEY' | 'OTHER' }> {
    const entities: Array<{ text: string; type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'DATE' | 'MONEY' | 'OTHER' }> = [];
    
    // Simple regex-based entity extraction
    const patterns = [
      { regex: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, type: 'PERSON' as const },
      { regex: /\b[A-Z][a-z]+ (Inc|Corp|LLC|Ltd|Company|Corporation)\b/g, type: 'ORGANIZATION' as const },
      { regex: /\b[A-Z][a-z]+ (Street|Avenue|Road|Boulevard|Drive)\b/g, type: 'LOCATION' as const },
      { regex: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, type: 'DATE' as const },
      { regex: /\$\d+(?:,\d{3})*(?:\.\d{2})?\b/g, type: 'MONEY' as const }
    ];

    patterns.forEach(({ regex, type }) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type
        });
      }
    });

    return entities;
  }

  /**
   * Classify text into categories
   */
  classifyText(text: string): Array<{ category: string; confidence: number }> {
    const categories = [
      { name: 'business', keywords: ['business', 'company', 'profit', 'revenue', 'market', 'customer'] },
      { name: 'technical', keywords: ['technology', 'software', 'system', 'code', 'development', 'programming'] },
      { name: 'personal', keywords: ['personal', 'family', 'friend', 'relationship', 'life', 'home'] },
      { name: 'academic', keywords: ['research', 'study', 'education', 'university', 'learning', 'knowledge'] },
      { name: 'health', keywords: ['health', 'medical', 'doctor', 'treatment', 'wellness', 'fitness'] }
    ];

    const words = this.tokenize(text).map(w => w.toLowerCase());
    const scores = categories.map(category => {
      const matches = category.keywords.filter(keyword => 
        words.some(word => word.includes(keyword))
      );
      return {
        category: category.name,
        confidence: matches.length / category.keywords.length
      };
    });

    return scores
      .filter(score => score.confidence > 0)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  // Private helper methods
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private extractKeyPhrases(text: string): string[] {
    const words = this.tokenize(text);
    const phrases: string[] = [];
    
    // Extract 2-grams and 3-grams
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (bigram.length > 5 && !this.stopWords.has(words[i]) && !this.stopWords.has(words[i + 1])) {
        phrases.push(bigram);
      }
    }

    for (let i = 0; i < words.length - 2; i++) {
      const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      if (trigram.length > 8 && !this.stopWords.has(words[i]) && !this.stopWords.has(words[i + 1]) && !this.stopWords.has(words[i + 2])) {
        phrases.push(trigram);
      }
    }

    // Count phrase frequencies and return top phrases
    const phraseFreq = new Map<string, number>();
    phrases.forEach(phrase => {
      phraseFreq.set(phrase, (phraseFreq.get(phrase) || 0) + 1);
    });

    return Array.from(phraseFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([phrase]) => phrase);
  }

  private analyzeSentiment(text: string): { sentiment: 'positive' | 'negative' | 'neutral'; confidence: number } {
    const words = this.tokenize(text);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (this.positiveWords.has(word)) {
        positiveCount++;
      } else if (this.negativeWords.has(word)) {
        negativeCount++;
      }
    });

    const totalSentimentWords = positiveCount + negativeCount;
    if (totalSentimentWords === 0) {
      return { sentiment: 'neutral', confidence: 0.5 };
    }

    const positiveRatio = positiveCount / totalSentimentWords;
    const confidence = Math.abs(positiveRatio - 0.5) * 2;

    if (positiveRatio > 0.6) {
      return { sentiment: 'positive', confidence };
    } else if (positiveRatio < 0.4) {
      return { sentiment: 'negative', confidence };
    } else {
      return { sentiment: 'neutral', confidence: 0.5 };
    }
  }

  private calculateSentenceScore(sentence: string, fullText: string): number {
    const words = this.tokenize(sentence);
    const fullWords = this.tokenize(fullText);
    
    // Calculate TF-IDF-like score
    let score = 0;
    words.forEach(word => {
      if (!this.stopWords.has(word)) {
        const wordFreq = fullWords.filter(w => w === word).length;
        const sentenceFreq = words.filter(w => w === word).length;
        score += (sentenceFreq / words.length) * Math.log(fullWords.length / wordFreq);
      }
    });

    return score;
  }
}

// Singleton instance
export const nlpService = new NLPService();
