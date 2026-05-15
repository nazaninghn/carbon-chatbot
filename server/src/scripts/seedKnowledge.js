/**
 * Seed Knowledge Base with CarbonIQ v3.0 Question Data
 * Run: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const embeddingService = require('../services/embeddingService');
const logger = require('../utils/logger');

// Knowledge chunks from CarbonIQ v3.0 document
const KNOWLEDGE_CHUNKS = [
  // Phase 1 - Block A
  {
    content: `Soru A1: Şirketinizin tam ticari unvanı nedir? (What is the full legal name of your company?)
Tip: Metin girişi, tek satır, maks 200 karakter. Zorunlu.
Placeholder: Örn: ABC Teknoloji Danışmanlık A.Ş.
Yardımcı: Ticaret sicilinde kayıtlı tam unvanınızı girin. Rapor kapağında ve resmi belgede bu isim kullanılacak.
Doğrulama: Boş bırakılamaz. 200 karakteri aşamaz.
Hata: "Şirket adı zorunludur. Lütfen ticaret sicilinde kayıtlı tam unvanı girin."`,
    metadata: { questionId: 'A1', phase: 1, block: 'A', category: 'question_definition', isoSection: '§7.5', language: 'tr' },
  },
  {
    content: `Soru A2: Vergi kimlik numaranız nedir? (What is your tax identification number?)
Tip: Sayısal metin girişi, tam olarak 10 hane, yalnızca rakam. Zorunlu.
Placeholder: 0000000000
Yardımcı: 10 haneli VKN/TCKN. Sistem içi kimlik doğrulama için kullanılır, üçüncü taraflarla paylaşılmaz.
Doğrulama: Tam 10 hane olmalı. Yalnızca rakam kabul edilir. Boş bırakılamaz.
Hata: "Lütfen 10 haneli vergi kimlik numaranızı girin (yalnızca rakam)."`,
    metadata: { questionId: 'A2', phase: 1, block: 'A', category: 'question_definition', isoSection: '§7.5', language: 'tr' },
  },
  {
    content: `Soru A3: Şirketinizin kayıtlı olduğu ülke ve şehir nedir?
Tip: Çift alan — Ülke dropdown (ISO 3166-1) + Şehir metin girişi. Zorunlu.
Seçenekler: Türkiye (TR) → DEFRA+TÜİK önerir | İngiltere (GB) → DEFRA | Almanya (DE) → DEFRA | ABD (US) → EPA | Diğer → IPCC AR6
Yardımcı: Şirketin ticaret sicilinde kayıtlı olduğu ülke ve şehri seçin. Birden fazla ülkede tesis varsa ana merkezi yazın.
Etki: Ülke seçimi D1 emisyon faktörü veritabanı önerisini otomatik belirler.`,
    metadata: { questionId: 'A3', phase: 1, block: 'A', category: 'question_definition', isoSection: '§5.1', language: 'tr' },
  },
  {
    content: `Soru A4: Hangi yıla ait rapor hazırlıyoruz?
Tip: Yıl seçici dropdown — geçmiş 5 yıl + cari yıl. Zorunlu.
Seçenekler: 2020, 2021, 2022, 2023, 2024, 2025 (cari yıl — veri eksik olabilir)
Uyarı (cari yıl): "2025 henüz tamamlanmadı. Yıl sonu verileriniz eksik olabilir — bazı kalemlerde tahmini veri kullanmak gerekebilir."
Etki: Tüm veri girişleri bu yıla atanır. Cari yıl seçilirse Aşama 6'da otomatik kabul kaydı oluşturulur.`,
    metadata: { questionId: 'A4', phase: 1, block: 'A', category: 'question_definition', isoSection: '§6.1', language: 'tr' },
  },
  {
    content: `Soru B1: Şirketinizin ana sektörü nedir? (NACE Rev.2)
Tip: Arama destekli dropdown — NACE Bölüm A-U. Zorunlu.
Bu soru TÜM sonraki akışı belirler. Yanlış sektör seçimi tüm soruları bozar.
Seçenekler: NACE A (Tarım) → 3C AKTİF, CH₄/N₂O | NACE B (Madencilik) → Metan kaçak | NACE C (İmalat) → 3C tam | NACE D (Enerji) → SF₆ | NACE F (İnşaat) → İş makinesi | NACE G-N (Hizmetler) → 3C ATLANIR | NACE K (Finans) → PCAF | NACE O-U (Kamu) → 3C ATLANIR
Etki: Sektör seçimi Kapsam 1 proses sorularını, Kapsam 3 kategori önceliklendirmesini ve emisyon faktörü önerilerini belirler.`,
    metadata: { questionId: 'B1', phase: 1, block: 'B', category: 'question_definition', isoSection: '§5.1', language: 'tr' },
  },
  {
    content: `Soru D3: Organizasyon sınırı raporlama yaklaşımı nedir?
Tip: Tek seçimli kart formatı — 3 seçenek. Zorunlu.
1. Operasyonel Kontrol (Önerilen) — Operasyonel politikaları siz belirleyen tüm tesisler dahil. En yaygın.
2. Finansal Kontrol — Finansal ve operasyonel politikaları yönetme yetkisi olduğunuz birimler.
3. Hisse Payı — Her tesisten hisse oranınız kadar emisyon payı alınır.
Yardımcı: Emin değilseniz 'Operasyonel Kontrol' ile devam edin.
Etki: Aşama 2'deki sınır testi sorularını belirler. Değişiklik Aşama 2'yi sıfırlar.`,
    metadata: { questionId: 'D3', phase: 1, block: 'D', category: 'question_definition', isoSection: '§5.1', language: 'tr' },
  },
  // ISO References
  {
    content: `ISO 14064-1 §5.1 — Organizasyon Sınırı: Kuruluş, GHG envanterinin organizasyon sınırını belirlemelidir. Üç yaklaşım: operasyonel kontrol, finansal kontrol, hisse payı. Hariç tutulan kaynaklar gerekçelendirilmeli ve toplam emisyonun %5'ini geçmemeli.`,
    metadata: { category: 'iso_reference', isoSection: '§5.1', language: 'tr' },
  },
  {
    content: `ISO 14064-1 §5.2 — Kapsam 1 Doğrudan Emisyonlar: Sabit yanma, hareketli yanma, proses emisyonları ve kaçak emisyonlar. Kuruluşun sahip olduğu veya kontrol ettiği kaynaklardan doğrudan atmosfere salınan GHG emisyonları.`,
    metadata: { category: 'iso_reference', isoSection: '§5.2', scope: 'scope1', language: 'tr' },
  },
  {
    content: `ISO 14064-1 §5.3 — Kapsam 2 Dolaylı Enerji Emisyonları: Satın alınan elektrik, ısı, buhar veya soğutma enerjisinden kaynaklanan emisyonlar. Location-based metodoloji: bölgesel şebeke emisyon faktörü kullanılır.`,
    metadata: { category: 'iso_reference', isoSection: '§5.3', scope: 'scope2', language: 'tr' },
  },
  {
    content: `ISO 14064-1 §7.3 — Kabuller ve Varsayımlar: Tüm kabuller şeffaf biçimde belgelenmeli. Tip A: Veri eksikliği. Tip B: Metodoloji tercihi. Tip C: Sınır/kapsam kararı. Kabuller raporun güvenilirliğini etkiler.`,
    metadata: { category: 'iso_reference', isoSection: '§7.3', language: 'tr' },
  },
  // Emission Factor Guidance
  {
    content: `DEFRA 2023 Emisyon Faktörleri — Türkiye için önerilen:
Doğalgaz: 0.2023 kg CO₂e/kWh (TTW)
Motorin/Dizel: 2.5131 kg CO₂e/litre (TTW)
LPG: 1.5226 kg CO₂e/litre
Türkiye şebeke elektrik EF: 0.4312 kg CO₂e/kWh (TÜİK/DEFRA 2023)
Kaynak: DEFRA Greenhouse Gas Reporting: Conversion Factors 2023`,
    metadata: { category: 'emission_factor', language: 'tr' },
  },
  {
    content: `Soğutucu Gaz GWP Değerleri (IPCC AR6 2021):
R-410A: GWP 2088 | R-32: GWP 675 | R-22: GWP 1810 | R-134a: GWP 1430
R-404A: GWP 3922 | R-1234yf: GWP 4 | SF₆: GWP 23500
1 kg SF₆ kaçağı = 23.5 ton CO₂ eşdeğer. Küçük miktarlar bile büyük emisyona yol açar.`,
    metadata: { category: 'emission_factor', scope: 'scope1', language: 'tr' },
  },
  // Sector Guidance
  {
    content: `Hizmet Sektörü (NACE G-N) Rehberi:
- Proses emisyonları (3C) otomatik atlanır
- Kapsam 3 öncelikli kategoriler: Kat.1 (satın alma), Kat.6 (iş seyahati), Kat.7 (commute)
- Genellikle en büyük emisyon kaynağı: satın alınan elektrik (K2) ve iş seyahatleri (K3 Kat.6)
- Ofis tipi şirketlerde klima soğutucu gaz kaçağı sıklıkla gözden kaçar — GWP yüksek`,
    metadata: { category: 'sector_guidance', sector: 'G-N', language: 'tr' },
  },
  {
    content: `İmalat Sektörü (NACE C) Rehberi:
- Proses emisyonları (3C) TAM AKTİF — tüm kategoriler açık
- Kapsam 1 tüm kategoriler: sabit yanma + hareketli + proses + kaçak
- Kapsam 3 öncelikli: Kat.1 (hammadde), Kat.4 (upstream taşıma), Kat.10 (ürün işleme), Kat.11 (ürün kullanımı), Kat.12 (ömür sonu)
- Endüstriyel fırınlar, kazanlar ve proses ekipmanları detaylı sorgulanır`,
    metadata: { category: 'sector_guidance', sector: 'C', language: 'tr' },
  },
];

async function seedKnowledge() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carboniq');
    logger.info('Connected to MongoDB for seeding');

    // Clear existing knowledge (optional - comment out to append)
    // await Knowledge.deleteMany({});
    // logger.info('Cleared existing knowledge');

    let successCount = 0;
    let errorCount = 0;

    for (const chunk of KNOWLEDGE_CHUNKS) {
      try {
        await embeddingService.storeKnowledge(chunk.content, chunk.metadata);
        successCount++;
        logger.info(`Seeded: ${chunk.metadata.questionId || chunk.metadata.category} (${successCount}/${KNOWLEDGE_CHUNKS.length})`);
        // Rate limit to avoid OpenAI API limits
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        errorCount++;
        logger.error(`Failed to seed: ${chunk.metadata.questionId || chunk.metadata.category}`, error.message);
      }
    }

    logger.info(`Seeding complete: ${successCount} success, ${errorCount} errors`);
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedKnowledge();
