const mongoose = require('mongoose');

const knowledgeSchema = new mongoose.Schema({
  // Content
  content: {
    type: String,
    required: true,
  },
  // Metadata for filtering
  metadata: {
    questionId: String,       // e.g., "A1", "3A-1"
    phase: Number,            // 1-7
    block: String,            // e.g., "A", "3A", "6B"
    category: {
      type: String,
      enum: [
        'question_definition',
        'conditional_logic',
        'validation_rules',
        'system_messages',
        'ux_guidance',
        'iso_reference',
        'emission_factor',
        'calculation_method',
        'sector_guidance',
      ],
    },
    isoSection: String,       // e.g., "§5.1", "§7.3"
    scope: String,            // "scope1", "scope2", "scope3"
    sector: String,           // NACE code
    language: {
      type: String,
      enum: ['tr', 'en'],
      default: 'tr',
    },
  },
  // Vector embedding
  embedding: {
    type: [Number],
    index: '2dsphere',
  },
  // Source tracking
  source: {
    type: String,
    default: 'carboniq_v3',
  },
  version: {
    type: String,
    default: '3.0',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Text index for fallback search
knowledgeSchema.index({ content: 'text' });
knowledgeSchema.index({ 'metadata.questionId': 1 });
knowledgeSchema.index({ 'metadata.phase': 1, 'metadata.block': 1 });

module.exports = mongoose.model('Knowledge', knowledgeSchema);
