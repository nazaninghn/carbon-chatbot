const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  metadata: {
    questionId: String,       // e.g., "A1", "B1", "3A-1"
    phase: Number,            // 1-7
    block: String,            // e.g., "A", "B", "3A"
    questionType: String,     // text, dropdown, binary, etc.
    validationStatus: String, // valid, invalid, warning
    ragContext: [String],     // Retrieved knowledge chunks used
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    default: 'New Carbon Report',
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active',
  },
  currentPhase: {
    type: Number,
    default: 1,
    min: 1,
    max: 7,
  },
  currentQuestion: {
    type: String,
    default: 'A1',
  },
  messages: [messageSchema],
  // Collected data from the questionnaire
  reportData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // Assumptions tracked (Amber records)
  assumptions: [{
    type: { type: String, enum: ['A', 'B', 'C'] },
    trigger: String,
    autoText: String,
    impactDirection: String,
    questionId: String,
    phase: Number,
  }],
  // Exclusions
  exclusions: [{
    entityName: String,
    reason: String,
    isoRef: String,
    magnitude: String,
    futureInclusion: String,
  }],
  // Report metadata
  reportMeta: {
    companyName: String,
    vkn: String,
    country: String,
    city: String,
    reportingYear: Number,
    baselineYear: Number,
    sector: String,
    efDatabase: String,
    boundaryApproach: String,
    scope3Approach: String,
  },
  // Emission totals
  emissions: {
    scope1: { type: Number, default: 0 },
    scope2: { type: Number, default: 0 },
    scope3: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
});

// Index for efficient queries
sessionSchema.index({ userId: 1, status: 1 });
sessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Session', sessionSchema);
