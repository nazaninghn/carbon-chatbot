/**
 * Question Flow Service
 * Manages the 133-question flow with conditional logic
 */

const { QUESTIONS, formatQuestion, getWelcomeMessage } = require('../data/questions');

// Question flow definition based on CarbonIQ v3.0
const QUESTION_FLOW = {
  // Phase 1 - Block A
  'A1': { phase: 1, block: 'A', next: 'A2', required: true },
  'A2': { phase: 1, block: 'A', next: 'A3', required: true },
  'A3': { phase: 1, block: 'A', next: 'A4', required: true },
  'A4': { phase: 1, block: 'A', next: 'A5', required: true },
  'A5': { phase: 1, block: 'A', next: 'A6', required: true },
  'A6': { phase: 1, block: 'A', next: 'A7', required: false },
  'A7': { phase: 1, block: 'A', next: 'A7a', required: false, conditional: true },
  'A7a': { phase: 1, block: 'A', next: 'B1', required: false, showIf: (data) => data.A7 === 'yes' },
  // Phase 1 - Block B
  'B1': { phase: 1, block: 'B', next: 'B2', required: true },
  'B2': { phase: 1, block: 'B', next: 'B3', required: true },
  'B3': { phase: 1, block: 'B', next: 'B4', required: true },
  'B4': { phase: 1, block: 'B', next: 'B5', required: true },
  'B5': { phase: 1, block: 'B', next: 'B6', required: true },
  'B6': { phase: 1, block: 'B', next: 'C1', required: false },
  // Phase 1 - Block C
  'C1': { phase: 1, block: 'C', next: 'C2', required: true },
  'C2': { phase: 1, block: 'C', next: 'C3', required: true },
  'C3': { phase: 1, block: 'C', next: 'D1', required: true },
  // Phase 1 - Block D
  'D1': { phase: 1, block: 'D', next: 'D2', required: true },
  'D2': { phase: 1, block: 'D', next: 'D3', required: false },
  'D3': { phase: 1, block: 'D', next: 'D4', required: true },
  'D4': { phase: 1, block: 'D', next: '2A-0', required: true },
  // Phase 2 - Organization Boundary
  '2A-0': { phase: 2, block: '2A', next: '2A-1', required: false },
  '2A-1': { phase: 2, block: '2A', next: '2A-2', required: true },
  '2A-2': { phase: 2, block: '2A', next: '2A-3', required: true, repeatable: true },
  '2A-3': { phase: 2, block: '2A', next: '2A-4', required: true, repeatable: true },
  '2A-4': { phase: 2, block: '2A', next: '2A-5', required: false, showIf: (data) => data.C1 === 'yes' },
  '2A-5': { phase: 2, block: '2A', next: '2B-OC1', required: false, showIf: (data) => data.C1 === 'yes' && data.D3 === 'equity_share' },
  // Phase 2 - Boundary Tests
  '2B-OC1': { phase: 2, block: '2B', next: '2B-OC2', required: false, showIf: (data) => data.D3 === 'operational_control' },
  '2B-OC2': { phase: 2, block: '2B', next: '2C-1', required: false, showIf: (data) => data.D3 === 'operational_control' },
  '2B-FC1': { phase: 2, block: '2B', next: '2B-FC2', required: false, showIf: (data) => data.D3 === 'financial_control' },
  '2B-FC2': { phase: 2, block: '2B', next: '2C-1', required: false, showIf: (data) => data.D3 === 'financial_control' },
  '2B-EQ1': { phase: 2, block: '2B', next: '2C-1', required: false, showIf: (data) => data.D3 === 'equity_share' },
  // Phase 2 - Exclusions
  '2C-1': { phase: 2, block: '2C', next: '2C-2', required: true },
  '2C-2': { phase: 2, block: '2C', next: '2C-3', required: true },
  '2C-3': { phase: 2, block: '2C', next: '3-GIRIS', required: false },
  // Phase 3 - Scope 1
  '3-GIRIS': { phase: 3, block: '3', next: '3A-0', required: false },
  '3A-0': { phase: 3, block: '3A', next: '3A-1', required: true, conditional: true },
  '3A-1': { phase: 3, block: '3A', next: '3B-0', required: false, showIf: (data) => data['3A-0'] === 'yes' },
  '3B-0': { phase: 3, block: '3B', next: '3B-1', required: true, conditional: true },
  '3B-1': { phase: 3, block: '3B', next: '3C-0', required: false, showIf: (data) => data['3B-0'] === 'yes' },
  '3C-0': { phase: 3, block: '3C', next: '3C-1', required: false, showIf: (data) => ['A', 'B', 'C', 'D', 'E', 'F'].includes(data.naceSection) },
  '3C-1': { phase: 3, block: '3C', next: '3D-0', required: false, showIf: (data) => ['A', 'B', 'C', 'D', 'E', 'F'].includes(data.naceSection) },
  '3D-0': { phase: 3, block: '3D', next: '3D-2', required: true },
  '3D-2': { phase: 3, block: '3D', next: 'TY-1', required: true },
  'TY-1': { phase: 3, block: 'TY', next: '4-GIRIS', required: true },
  // Phase 4 - Scope 2
  '4-GIRIS': { phase: 4, block: '4', next: '4A-0', required: false },
  '4A-0': { phase: 4, block: '4A', next: '4A-1', required: true, conditional: true },
  '4A-1': { phase: 4, block: '4A', next: '4B-0', required: false, showIf: (data) => data['4A-0'] === 'yes', repeatable: true },
  '4B-0': { phase: 4, block: '4B', next: '4B-1', required: true, conditional: true },
  '4B-1': { phase: 4, block: '4B', next: '4C-1', required: false, showIf: (data) => data['4B-0'] === 'yes' },
  '4C-1': { phase: 4, block: '4C', next: '5-GIRIS', required: true },
  '5-GIRIS': { phase: 5, block: '5', next: 'K3C1-0', required: false },
  // Phase 5 - Scope 3 (simplified - 15 categories)
  'K3C1-0': { phase: 5, block: 'K3C1', next: 'K3C1-1', required: true },
  'K3C1-1': { phase: 5, block: 'K3C1', next: 'K3C2-0', required: false },
  'K3C2-0': { phase: 5, block: 'K3C2', next: 'K3C2-1', required: true },
  'K3C2-1': { phase: 5, block: 'K3C2', next: 'K3C3-INFO', required: false },
  'K3C3-INFO': { phase: 5, block: 'K3C3', next: 'K3C4-0', required: true },
  'K3C4-0': { phase: 5, block: 'K3C4', next: 'K3C5-0', required: true },
  'K3C5-0': { phase: 5, block: 'K3C5', next: 'K3C6-0', required: true },
  'K3C6-0': { phase: 5, block: 'K3C6', next: 'K3C7-0', required: true },
  'K3C7-0': { phase: 5, block: 'K3C7', next: 'K3C8-0', required: true },
  'K3C8-0': { phase: 5, block: 'K3C8', next: 'K3C9-0', required: true },
  'K3C9-0': { phase: 5, block: 'K3C9', next: 'K3C10-0', required: true },
  'K3C10-0': { phase: 5, block: 'K3C10', next: 'K3C11-0', required: true },
  'K3C11-0': { phase: 5, block: 'K3C11', next: 'K3C12-0', required: true },
  'K3C12-0': { phase: 5, block: 'K3C12', next: 'K3C13-0', required: true },
  'K3C13-0': { phase: 5, block: 'K3C13', next: 'K3C14-0', required: true },
  'K3C14-0': { phase: 5, block: 'K3C14', next: 'K3C15-0', required: false, showIf: (data) => data.C3 === 'yes' },
  'K3C15-0': { phase: 5, block: 'K3C15', next: 'K3-TY', required: false },
  'K3-TY': { phase: 5, block: 'K3', next: '6-GIRIS', required: true },
  // Phase 6 - Closure
  '6-GIRIS': { phase: 6, block: '6', next: '6A-1', required: false },
  '6A-1': { phase: 6, block: '6A', next: '6B-0', required: true },
  '6B-0': { phase: 6, block: '6B', next: '6B-1', required: false },
  '6B-1': { phase: 6, block: '6B', next: '6B-5', required: true },
  '6B-5': { phase: 6, block: '6B', next: '6C-1', required: true },
  '6C-1': { phase: 6, block: '6C', next: '6D-1', required: true },
  '6D-1': { phase: 6, block: '6D', next: '6E-1', required: false },
  '6E-1': { phase: 6, block: '6E', next: '6F-1', required: false },
  '6F-1': { phase: 6, block: '6F', next: '7-GIRIS', required: true },
  // Phase 7 - Report Generation
  '7-GIRIS': { phase: 7, block: '7', next: '7C-1', required: false },
  '7C-1': { phase: 7, block: '7C', next: '7C-2', required: true },
  '7C-2': { phase: 7, block: '7C', next: '7A-INFO', required: true },
  '7A-INFO': { phase: 7, block: '7A', next: null, required: false },
};

class QuestionFlowService {
  /**
   * Get the next question based on current state and collected data
   */
  getNextQuestion(currentQuestionId, reportData) {
    const current = QUESTION_FLOW[currentQuestionId];
    if (!current || !current.next) return null;

    let nextId = current.next;
    let nextQuestion = QUESTION_FLOW[nextId];

    // Check conditional logic - skip questions that shouldn't show
    const visited = new Set();
    while (nextQuestion && nextQuestion.showIf && !nextQuestion.showIf(reportData)) {
      if (visited.has(nextId)) break; // cycle guard
      visited.add(nextId);
      nextId = nextQuestion.next;
      nextQuestion = nextId ? QUESTION_FLOW[nextId] : null;
    }

    return nextId;
  }

  /**
   * Get question definition
   */
  getQuestion(questionId) {
    return QUESTION_FLOW[questionId] || null;
  }

  /**
   * Get current phase progress
   */
  getProgress(currentQuestionId) {
    const current = QUESTION_FLOW[currentQuestionId];
    if (!current) return { phase: 1, progress: 0 };

    const phaseQuestions = Object.entries(QUESTION_FLOW)
      .filter(([, q]) => q.phase === current.phase);
    const currentIndex = phaseQuestions.findIndex(([id]) => id === currentQuestionId);

    return {
      phase: current.phase,
      block: current.block,
      progress: Math.round(((currentIndex + 1) / phaseQuestions.length) * 100),
      totalPhases: 7,
    };
  }

  /**
   * Check if a question should be shown based on conditions
   */
  shouldShowQuestion(questionId, reportData) {
    const question = QUESTION_FLOW[questionId];
    if (!question) return false;
    if (!question.showIf) return true;
    return question.showIf(reportData);
  }

  /**
   * Get all questions for a phase
   */
  getPhaseQuestions(phase) {
    return Object.entries(QUESTION_FLOW)
      .filter(([, q]) => q.phase === phase)
      .map(([id, q]) => ({ id, ...q }));
  }

  /**
   * Get full question content from database (TR or EN)
   * Returns null for Phase 2-7 questions not yet in DB (handled by LLM)
   */
  getQuestionContent(questionId, lang = 'tr') {
    return QUESTIONS[questionId] || null;
  }

  /**
   * Format question as a ready-to-send chat message
   */
  formatQuestionMessage(questionId, lang = 'tr') {
    const questionNumber = this.getQuestionNumber(questionId);
    return formatQuestion(questionId, lang, questionNumber);
  }

  /**
   * Get sequential question number (1-133)
   */
  getQuestionNumber(questionId) {
    const allIds = Object.keys(QUESTION_FLOW);
    const idx = allIds.indexOf(questionId);
    return idx >= 0 ? idx + 1 : null;
  }

  /**
   * Get welcome / intro message
   */
  getWelcomeMessage(lang = 'tr') {
    return getWelcomeMessage(lang);
  }

  /**
   * Resolve answer text to a value for select/yesno/multiselect questions
   * Accepts "1", "2", "3"... or the option label text
   */
  resolveAnswer(questionId, rawAnswer, lang = 'tr') {
    const q = QUESTIONS[questionId];
    if (!q) return { resolved: rawAnswer, valid: true };

    const content = q[lang] || q.tr;
    const options = content?.options;
    if (!options || options.length === 0) return { resolved: rawAnswer, valid: true };

    const trimmed = rawAnswer.trim();

    // Numeric selection: "1", "2", ...
    const numMatch = trimmed.match(/^(\d+)$/);
    if (numMatch) {
      const idx = parseInt(numMatch[1], 10) - 1;
      if (idx >= 0 && idx < options.length) {
        return { resolved: options[idx].value, label: options[idx].label, valid: true };
      }
      return { resolved: rawAnswer, valid: false, error: `Please select a number between 1 and ${options.length}.` };
    }

    // Text match against label or value
    const lower = trimmed.toLowerCase();
    const matched = options.find(
      (o) => o.label.toLowerCase().includes(lower) || o.value.toLowerCase() === lower
    );
    if (matched) return { resolved: matched.value, label: matched.label, valid: true };

    return { resolved: rawAnswer, valid: true };
  }
}

module.exports = new QuestionFlowService();
