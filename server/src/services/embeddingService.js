const Knowledge = require('../models/Knowledge');
const logger = require('../utils/logger');

let openai = null;
try {
  const key = process.env.OPENAI_API_KEY;
  if (key && key !== 'MOCK_MODE' && key.trim().length > 30 && key.trim().startsWith('sk-')) {
    const OpenAI = require('openai');
    openai = new OpenAI({ apiKey: key.trim() });
  }
} catch (e) {
  // OpenAI not configured
}

class EmbeddingService {
  constructor() {
    this.model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
    this.dimensions = parseInt(process.env.EMBEDDING_DIMENSIONS) || 1536;
  }

  /**
   * Generate embedding vector for a text
   */
  async generateEmbedding(text) {
    if (!openai) {
      // Return a random vector for development
      return Array.from({ length: this.dimensions }, () => Math.random() * 2 - 1);
    }
    try {
      const response = await openai.embeddings.create({
        model: this.model,
        input: text,
        dimensions: this.dimensions,
      });
      return response.data[0].embedding;
    } catch (error) {
      logger.error('Embedding generation error:', error);
      // Fallback to random vector
      return Array.from({ length: this.dimensions }, () => Math.random() * 2 - 1);
    }
  }

  /**
   * Store a knowledge chunk with its embedding
   */
  async storeKnowledge(content, metadata) {
    try {
      const embedding = await this.generateEmbedding(content);
      const knowledge = new Knowledge({
        content,
        metadata,
        embedding,
      });
      await knowledge.save();
      logger.info(`Knowledge stored: ${metadata.questionId || 'general'}`);
      return knowledge;
    } catch (error) {
      logger.error('Store knowledge error:', error);
      throw error;
    }
  }

  /**
   * Semantic search - find most relevant knowledge chunks
   */
  async search(query, options = {}) {
    const {
      limit = 5,
      phase = null,
      block = null,
      category = null,
      scope = null,
      minScore = 0.7,
    } = options;

    try {
      const queryEmbedding = await this.generateEmbedding(query);

      // Build filter
      const filter = { isActive: true };
      if (phase) filter['metadata.phase'] = phase;
      if (block) filter['metadata.block'] = block;
      if (category) filter['metadata.category'] = category;
      if (scope) filter['metadata.scope'] = scope;

      // Get matching documents and compute cosine similarity (cap at 500 to avoid OOM)
      const documents = await Knowledge.find(filter).limit(500).lean();

      const results = documents
        .map((doc) => ({
          ...doc,
          score: this.cosineSimilarity(queryEmbedding, doc.embedding),
        }))
        .filter((doc) => doc.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return results.map(({ embedding, ...rest }) => rest);
    } catch (error) {
      logger.error('Semantic search error:', error);
      // Fallback to text search
      return this.textSearch(query, options);
    }
  }

  /**
   * Fallback text search when embedding search fails
   */
  async textSearch(query, options = {}) {
    const { limit = 5, phase = null, block = null } = options;
    const filter = { isActive: true };
    if (phase) filter['metadata.phase'] = phase;
    if (block) filter['metadata.block'] = block;

    try {
      const results = await Knowledge.find(
        { ...filter, $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .lean();

      return results;
    } catch (error) {
      logger.error('Text search error:', error);
      return [];
    }
  }

  /**
   * Cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Get knowledge for a specific question
   */
  async getQuestionKnowledge(questionId) {
    try {
      return await Knowledge.find({
        'metadata.questionId': questionId,
        isActive: true,
      }).limit(20).lean();
    } catch (error) {
      logger.error('Get question knowledge error:', error);
      return [];
    }
  }
}

module.exports = new EmbeddingService();
