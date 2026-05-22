const embeddingService = require('./embeddingService');
const questionFlowService = require('./questionFlowService');
const logger = require('../utils/logger');

// Initialize Groq
let groq = null;
const groqKey = process.env.GROQ_API_KEY;
if (groqKey && groqKey !== 'YOUR_GROQ_KEY_HERE' && groqKey.length > 10) {
  try {
    const Groq = require('groq-sdk');
    groq = new Groq({ apiKey: groqKey });
    logger.info('✅ Groq AI configured');
  } catch (e) {
    logger.warn('Groq init failed:', e.message);
  }
} else {
  logger.info('⚠ Groq not configured — running in MOCK mode');
}

const PHASE_LABELS = {
  tr: {
    1: 'Aşama 1 — Şirketi Tanıma',
    2: 'Aşama 2 — Organizasyon Sınırı',
    3: 'Aşama 3 — Kapsam 1 (Doğrudan Emisyonlar)',
    4: 'Aşama 4 — Kapsam 2 (Elektrik & Enerji)',
    5: 'Aşama 5 — Kapsam 3 (Dolaylı Emisyonlar)',
    6: 'Aşama 6 — Kabuller & Hariç Tutmalar',
    7: 'Aşama 7 — Rapor Üretimi',
  },
  en: {
    1: 'Phase 1 — Company Identification',
    2: 'Phase 2 — Organizational Boundary',
    3: 'Phase 3 — Scope 1 (Direct Emissions)',
    4: 'Phase 4 — Scope 2 (Electricity & Energy)',
    5: 'Phase 5 — Scope 3 (Indirect Emissions)',
    6: 'Phase 6 — Assumptions & Exclusions',
    7: 'Phase 7 — Report Generation',
  },
};

class RAGService {
  constructor() {
    this.model = process.env.CHAT_MODEL || 'llama-3.3-70b-versatile';
    this.temperature = parseFloat(process.env.CHAT_TEMPERATURE) || 0.3;
    this.maxTokens = parseInt(process.env.CHAT_MAX_TOKENS) || 2000;
  }

  /**
   * Build a concise system prompt for the LLM.
   * The LLM does NOT generate question text — it validates answers and handles
   * off-topic questions. Question text is served directly from the database.
   */
  buildSystemPrompt(sessionContext) {
    const { currentPhase, currentQuestion, reportData, lang } = sessionContext;
    const isEn = lang === 'en';
    const phaseLabel = PHASE_LABELS[lang]?.[currentPhase] || `Phase ${currentPhase}`;

    const questionData = questionFlowService.getQuestionContent(currentQuestion, lang);
    const questionText = questionData?.[lang]?.text || questionData?.tr?.text || '';
    const questionType = questionData?.type || 'text';
    const options = questionData?.[lang]?.options || questionData?.tr?.options || [];

    if (isEn) {
      return `You are **CarbonIQ** — a professional ISO 14064-1 carbon footprint reporting assistant.
Language: English only.

CURRENT STATE:
- ${phaseLabel}
- Question ID: ${currentQuestion || 'A1'}
- Question: "${questionText}"
- Type: ${questionType}
${options.length ? `- Options: ${options.map((o, i) => `${i + 1}. ${o.label}`).join(' | ')}` : ''}
- Collected fields: ${Object.keys(reportData || {}).length}

YOUR ROLE:
1. The question text is already shown to the user — do NOT repeat it.
2. VALIDATE the user's answer:
   - For select/yesno: check if it matches an option (by number or text).
   - For text/textarea: check it is not empty and within length limits.
   - For number: check it is a valid positive number.
   - For year: check it is a valid year.
3. If VALID: reply with ✅ and a brief acknowledgment, then output exactly: [NEXT_QUESTION]
4. If INVALID: reply with ⚠ and a clear, specific error message. Ask the user to try again. Do NOT output [NEXT_QUESTION].
5. If the user asks an OFF-TOPIC question (carbon concepts, ISO 14064, etc.): answer briefly (2-3 sentences) then return to the current question.
6. If the user types "back" or "previous": output [PREV_QUESTION].
7. If the user types "help": briefly explain the current question and re-show the options.

TONE: Professional, friendly, concise. Never repeat the full question unless asked.
FORMAT: Use **bold** for key terms, ✅ for success, ⚠ for warnings, ✗ for errors.`;
    }

    return `Sen **CarbonIQ** — ISO 14064-1 uyumlu profesyonel bir karbon ayak izi raporlama asistanısın.
Dil: Yalnızca Türkçe.

MEVCUT DURUM:
- ${phaseLabel}
- Soru ID: ${currentQuestion || 'A1'}
- Soru: "${questionText}"
- Tür: ${questionType}
${options.length ? `- Seçenekler: ${options.map((o, i) => `${i + 1}. ${o.label}`).join(' | ')}` : ''}
- Toplanan alan sayısı: ${Object.keys(reportData || {}).length}

GÖREVİN:
1. Soru metni kullanıcıya zaten gösterildi — TEKRARLAMA.
2. Kullanıcının yanıtını DOĞRULA:
   - select/yesno için: numaralı veya metin eşleşmesini kontrol et.
   - metin/textarea için: boş olmadığını ve karakter sınırını kontrol et.
   - sayı için: geçerli pozitif sayı olduğunu kontrol et.
   - yıl için: geçerli yıl olduğunu kontrol et.
3. GEÇERLİYSE: ✅ ile kısa bir onay yaz, ardından tam olarak şunu yaz: [NEXT_QUESTION]
4. GEÇERSİZSE: ⚠ ile açık ve spesifik bir hata mesajı yaz. Tekrar denemesini iste. [NEXT_QUESTION] YAZMA.
5. Kullanıcı KONU DIŞI soru sorarsa (karbon kavramları, ISO 14064 vb.): kısaca (2-3 cümle) yanıtla, sonra mevcut soruya dön.
6. Kullanıcı "geri" veya "önceki" yazarsa: [PREV_QUESTION] yaz.
7. Kullanıcı "yardım" yazarsa: mevcut soruyu kısaca açıkla ve seçenekleri tekrar göster.

TON: Profesyonel, samimi, öz. Teknik terimleri sade dille açıkla.
FORMAT: **kalın** önemli terimler için, ✅ başarı, ⚠ uyarı, ✗ hata.`;
  }

  /**
   * Primary method: process a user message
   */
  async processMessage(userMessage, sessionContext, conversationHistory = []) {
    const { currentQuestion, lang = 'tr' } = sessionContext;

    // Special commands handled locally (no API call needed)
    const lower = userMessage.trim().toLowerCase();
    if (lower === 'back' || lower === 'geri' || lower === 'önceki') {
      return {
        content: lang === 'en'
          ? '↩ Going back to the previous question...'
          : '↩ Önceki soruya dönülüyor...',
        metadata: { action: 'prev' },
        ragChunks: [],
        tokensUsed: 0,
      };
    }

    if (!groq) {
      return this.getMockResponse(userMessage, sessionContext);
    }

    try {
      const ragContext = await this.retrieveContext(userMessage, sessionContext);

      const messages = [
        { role: 'system', content: this.buildSystemPrompt(sessionContext) },
      ];

      if (ragContext.length > 0) {
        const contextText = ragContext.map((c) => c.content).join('\n---\n');
        messages.push({
          role: 'system',
          content: lang === 'en'
            ? `KNOWLEDGE BASE:\n${contextText}`
            : `BİLGİ TABANI:\n${contextText}`,
        });
      }

      // Strip the formatted question block from stored assistant messages before
      // sending history to the LLM.  The DB stores "✅ confirmation\n\n---\n\nQuestion…"
      // but the LLM should only see the confirmation part — otherwise it learns
      // to hallucinate question text in its own responses, causing duplicate questions.
      const recentHistory = conversationHistory.slice(-8);
      messages.push(...recentHistory.map((msg) => {
        if (msg.role !== 'assistant') return { role: msg.role, content: msg.content };
        const cleaned = msg.content
          // Remove everything from the --- separator onward (question block starts there)
          .replace(/\n+---\n+[\s\S]*/, '')
          // Also strip standalone question header if --- is absent
          .replace(/\n+\*?(?:Aşama \d+|Phase \d+)\s*[·•]\s*(?:Soru|Question)\s*\d+\/\d+\*?[\s\S]*/, '')
          .trim();
        return { role: 'assistant', content: cleaned || msg.content };
      }));

      messages.push({ role: 'user', content: userMessage });

      const completion = await groq.chat.completions.create({
        model: this.model,
        messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      });

      // Guard against API content-filter refusals that return empty choices
      if (!completion.choices?.length || !completion.choices[0]?.message?.content) {
        logger.warn('Groq returned empty choices — falling back to mock');
        return this.getMockResponse(userMessage, sessionContext);
      }
      const assistantMessage = completion.choices[0].message.content;
      const metadata = this.extractMetadata(assistantMessage, sessionContext);

      return {
        content: assistantMessage,
        metadata,
        ragChunks: ragContext.map((c) => c._id?.toString()),
        tokensUsed: completion.usage?.total_tokens || 0,
      };
    } catch (error) {
      logger.error('RAG process error:', error);
      return this.getMockResponse(userMessage, sessionContext);
    }
  }

  /**
   * Retrieve relevant knowledge from vector DB
   */
  async retrieveContext(query, sessionContext) {
    const { currentPhase, currentQuestion } = sessionContext;
    let results = [];

    try {
      if (currentQuestion) {
        const qKnowledge = await embeddingService.getQuestionKnowledge(currentQuestion);
        results.push(...qKnowledge);
      }
      const semanticResults = await embeddingService.search(query, {
        limit: 3, phase: currentPhase, minScore: 0.65,
      });
      const seen = new Set(results.map((r) => r._id?.toString()));
      for (const r of semanticResults) {
        if (!seen.has(r._id?.toString())) results.push(r);
      }
    } catch (ragErr) {
      logger.warn('RAG context retrieval failed (continuing without context):', ragErr.message);
    }

    return results.slice(0, 5);
  }

  /**
   * Extract action metadata from assistant response
   */
  extractMetadata(response, sessionContext) {
    const metadata = {
      questionId: sessionContext.currentQuestion,
      phase: sessionContext.currentPhase,
    };

    if (response.includes('[NEXT_QUESTION]')) {
      // Only [NEXT_QUESTION] advances the flow — not ✅ alone.
      // The LLM is instructed to emit this token when valid; if it forgets,
      // the user can retry rather than silently advancing on a bad answer.
      metadata.action = 'next';
      metadata.validationStatus = 'valid';
    } else if (response.includes('[PREV_QUESTION]')) {
      metadata.action = 'prev';
    } else if (response.includes('✗') || response.includes('✕')) {
      // ✗ U+2717 (ballot X) or ✕ U+2715 (multiplication X) — both mean invalid
      metadata.validationStatus = 'invalid';
    } else if (response.includes('⚠')) {
      metadata.validationStatus = 'warning';
    } else if (response.includes('✅')) {
      // ✅ present but [NEXT_QUESTION] absent — treat as validation-passed but
      // do NOT advance; the LLM response probably omitted the token by mistake.
      // This keeps the question in place so the user is not silently skipped.
      metadata.validationStatus = 'valid';
    }

    return metadata;
  }

  /**
   * Get the next question message (from DB or LLM-generated for Phase 2-7)
   */
  getNextQuestionMessage(nextQuestionId, lang = 'tr') {
    const msg = questionFlowService.formatQuestionMessage(nextQuestionId, lang);
    if (msg) return msg;

    // Fallback for questions not yet in DB
    const isEn = lang === 'en';
    return isEn
      ? `*Preparing next question: ${nextQuestionId}...*`
      : `*Sonraki soru hazırlanıyor: ${nextQuestionId}...*`;
  }

  /**
   * Mock responses when Groq is not configured
   */
  getMockResponse(userMessage, sessionContext) {
    const { currentQuestion, lang = 'tr' } = sessionContext;
    const isEn = lang === 'en';
    const lower = userMessage.toLowerCase();

    if (lower.includes('başla') || lower.includes('start') || lower.includes('merhaba') || lower.includes('hello')) {
      const firstQ = questionFlowService.formatQuestionMessage('A1', lang);
      return {
        content: firstQ || (isEn ? 'Starting...' : 'Başlıyoruz...'),
        metadata: { questionId: 'A1', phase: 1, action: 'show_question' },
        ragChunks: [],
        tokensUsed: 0,
      };
    }

    return {
      content: isEn
        ? `✅ Answer recorded: *"${userMessage}"*\n\n[NEXT_QUESTION]`
        : `✅ Yanıt kaydedildi: *"${userMessage}"*\n\n[NEXT_QUESTION]`,
      metadata: { questionId: currentQuestion, action: 'next', validationStatus: 'valid' },
      ragChunks: [],
      tokensUsed: 0,
    };
  }
}

module.exports = new RAGService();
