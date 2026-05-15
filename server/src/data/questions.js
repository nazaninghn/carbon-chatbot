/**
 * CarbonIQ Question Database — v3.0
 * ISO 14064-1 | 133 Questions | Bilingual: TR + EN
 *
 * Each question:
 *   id, phase, block, type, required, next, showIf?, validation?
 *   tr: { text, placeholder, helper, options?, systemMessages }
 *   en: { text, placeholder, helper, options?, systemMessages }
 *
 * types: 'text' | 'textarea' | 'number' | 'select' | 'multiselect'
 *        | 'yesno' | 'year' | 'info' | 'dual'
 */

const QUESTIONS = {

  // ─────────────────────────────────────────────
  // PHASE 1 — BLOCK A · Administrative Information
  // ─────────────────────────────────────────────

  A1: {
    id: 'A1', phase: 1, block: 'A', type: 'text', required: true, next: 'A2',
    validation: { maxLength: 200 },
    tr: {
      text: 'Şirketinizin tam ticari unvanı nedir?',
      placeholder: 'Örn: ABC Teknoloji Danışmanlık A.Ş.',
      helper: 'Ticaret sicilinde kayıtlı tam unvanınızı girin. Rapor kapağında ve resmi belgede bu isim kullanılacak.',
      systemMessages: {
        error: ['Şirket adı zorunludur. Lütfen ticaret sicilinde kayıtlı tam unvanı girin.', 'Şirket adı en fazla 200 karakter olabilir.'],
      },
    },
    en: {
      text: 'What is the full legal name of your company?',
      placeholder: 'E.g.: ABC Technology Consulting Inc.',
      helper: 'Enter the full name as registered in the trade registry. This will appear on the report cover and all official documents.',
      systemMessages: {
        error: ['Company name is required. Please enter the full legal name.', 'Company name cannot exceed 200 characters.'],
      },
    },
  },

  A2: {
    id: 'A2', phase: 1, block: 'A', type: 'text', required: true, next: 'A3',
    validation: { pattern: '^[0-9]{10,11}$' },
    tr: {
      text: 'Vergi kimlik numaranız nedir?',
      placeholder: '0000000000',
      helper: '10 haneli VKN / 11 haneli TCKN. Sistem içi kimlik doğrulama için kullanılır, üçüncü taraflarla paylaşılmaz.',
      systemMessages: {
        error: ['Lütfen 10 veya 11 haneli vergi kimlik numaranızı girin (yalnızca rakam).', 'Vergi kimlik numarası zorunludur.'],
        warning: ['Bu VKN sisteme daha önce kaydedilmiş. Mevcut kaydınızı güncellemek ister misiniz, yoksa yeni bir rapor mu oluşturmak istiyorsunuz?'],
      },
    },
    en: {
      text: 'What is your tax identification number?',
      placeholder: '0000000000',
      helper: '10-digit tax ID (VKN) or 11-digit national ID (TCKN). Used for internal verification only — never shared with third parties.',
      systemMessages: {
        error: ['Please enter your 10 or 11-digit tax identification number (digits only).', 'Tax identification number is required.'],
        warning: ['This tax ID already exists in the system. Would you like to update the existing record or create a new report?'],
      },
    },
  },

  A3: {
    id: 'A3', phase: 1, block: 'A', type: 'dual', required: true, next: 'A4',
    tr: {
      text: 'Şirketinizin kayıtlı olduğu ülke ve şehir nedir?',
      placeholder: 'Ülke seçin | Şehir: İstanbul',
      helper: 'Şirketin ticaret sicilinde kayıtlı olduğu ülke ve şehri seçin. Birden fazla ülkede tesis varsa ana merkezi yazın — diğerleri Aşama 2\'de eklenecek.',
      options: [
        { value: 'TR', label: 'Türkiye (TR)' },
        { value: 'GB', label: 'İngiltere (GB)' },
        { value: 'DE', label: 'Almanya (DE)' },
        { value: 'US', label: 'ABD (US)' },
        { value: 'OTHER', label: 'Diğer ülke' },
      ],
      systemMessages: {
        error: ['Lütfen şirketinizin kayıtlı olduğu ülkeyi seçin.'],
        info: ['Bilgi: Emisyon faktörü veritabanı önerimiz seçtiğiniz ülkeye göre belirlendi. İsterseniz D1 adımında değiştirebilirsiniz.'],
      },
    },
    en: {
      text: 'In which country and city is your company registered?',
      placeholder: 'Select country | City: London',
      helper: 'Select the country and city where your company is registered in the trade registry. If operating in multiple countries, enter your headquarters — others will be added in Phase 2.',
      options: [
        { value: 'TR', label: 'Turkey (TR)' },
        { value: 'GB', label: 'United Kingdom (GB)' },
        { value: 'DE', label: 'Germany (DE)' },
        { value: 'US', label: 'United States (US)' },
        { value: 'OTHER', label: 'Other country' },
      ],
      systemMessages: {
        error: ['Please select the country where your company is registered.'],
        info: ['Note: The emission factor database recommendation will be based on the country you selected. You can change it in step D1.'],
      },
    },
  },

  A4: {
    id: 'A4', phase: 1, block: 'A', type: 'year', required: true, next: 'A5',
    tr: {
      text: 'Hangi yıla ait rapor hazırlıyoruz?',
      placeholder: 'Yıl seçin',
      helper: 'Tüm veri girişleriniz bu yıl için geçerli olacak. Cari yılı seçerseniz bazı verilerin tahmini olacağını unutmayın.',
      options: [
        { value: '2020', label: '2020' },
        { value: '2021', label: '2021' },
        { value: '2022', label: '2022' },
        { value: '2023', label: '2023' },
        { value: '2024', label: '2024' },
        { value: '2025', label: '2025 ⚠ (cari yıl — veri eksik olabilir)' },
      ],
      systemMessages: {
        error: ['Lütfen raporlama yılını seçin.'],
        warning: ['2025 henüz tamamlanmadı. Yıl sonu verileriniz eksik olabilir — bazı kalemlerde tahmini veri kullanmak gerekebilir. Bu durum raporunuzda belgelenecek. Devam etmek istiyor musunuz?'],
      },
    },
    en: {
      text: 'Which reporting year are we preparing this report for?',
      placeholder: 'Select year',
      helper: 'All your data entries will be valid for this year. Keep in mind that if you select the current year, some data may be estimated.',
      options: [
        { value: '2020', label: '2020' },
        { value: '2021', label: '2021' },
        { value: '2022', label: '2022' },
        { value: '2023', label: '2023' },
        { value: '2024', label: '2024' },
        { value: '2025', label: '2025 ⚠ (current year — data may be incomplete)' },
      ],
      systemMessages: {
        error: ['Please select the reporting year.'],
        warning: ['2025 is not yet complete. Year-end data may be missing — some items may require estimated data. This will be documented in your report. Do you want to continue?'],
      },
    },
  },

  A5: {
    id: 'A5', phase: 1, block: 'A', type: 'text', required: true, next: 'A6',
    validation: { maxLength: 100 },
    tr: {
      text: 'Raporu hazırlayan kişi veya birimin adı nedir?',
      placeholder: 'Örn: Ahmet Yılmaz — Sürdürülebilirlik Birimi',
      helper: 'Raporda "Hazırlayan" alanında görünecek. Ad ve birim birlikte yazılabilir.',
      systemMessages: {
        error: ['Hazırlayan kişi / birim adı zorunludur.'],
      },
    },
    en: {
      text: 'Who is preparing this report? (name and/or department)',
      placeholder: 'E.g.: Jane Smith — Sustainability Department',
      helper: 'Will appear in the "Prepared by" field of the report. Name and department can be written together.',
      systemMessages: {
        error: ['Preparer name / department is required.'],
      },
    },
  },

  A6: {
    id: 'A6', phase: 1, block: 'A', type: 'multiselect', required: false, next: 'A7',
    tr: {
      text: 'Bu raporun kullanım amacı nedir?',
      placeholder: null,
      helper: 'Birden fazla seçebilirsiniz. Rapor kapağında ve doğrulama beyanında yer alacak. Atlamak isterseniz devam edebilirsiniz.',
      options: [
        { value: 'internal', label: 'İç yönetim ve strateji' },
        { value: 'legal', label: 'Yasal zorunluluk (mevzuat uyumu)' },
        { value: 'voluntary', label: 'Gönüllü açıklama (CDP, GRI, TCFD vb.)' },
        { value: 'customer', label: 'Müşteri / tedarik zinciri talebi' },
        { value: 'skip', label: 'Atlamak istiyorum' },
      ],
      systemMessages: {
        info: [
          'Yasal zorunluluk seçtiniz. Hangi mevzuat veya düzenleme kapsamında raporlama yapıyorsunuz? (Örn: CSRD, Borsa İstanbul Sürdürülebilirlik Endeksi, TCFD vb.)',
          'Gönüllü açıklama için hangi çerçeveyi kullanıyorsunuz? (CDP, GRI, TCFD, diğer)',
        ],
      },
    },
    en: {
      text: 'What is the intended use of this report?',
      placeholder: null,
      helper: 'You can select multiple. Will appear on the report cover and verification statement. You can skip if you prefer.',
      options: [
        { value: 'internal', label: 'Internal management and strategy' },
        { value: 'legal', label: 'Regulatory compliance' },
        { value: 'voluntary', label: 'Voluntary disclosure (CDP, GRI, TCFD, etc.)' },
        { value: 'customer', label: 'Customer / supply chain requirement' },
        { value: 'skip', label: 'Skip this question' },
      ],
      systemMessages: {
        info: [
          'You selected regulatory compliance. Which regulation or framework are you reporting under? (E.g.: CSRD, TCFD requirement, etc.)',
          'For voluntary disclosure — which framework are you using? (CDP, GRI, TCFD, other)',
        ],
      },
    },
  },

  A7: {
    id: 'A7', phase: 1, block: 'A', type: 'yesno', required: false, next: 'A7a',
    tr: {
      text: 'Daha önce karbon raporu hazırladınız mı?',
      placeholder: null,
      helper: 'Daha önce hazırladıysanız baz yıl karşılaştırması ve trend analizi raporunuza eklenecek.',
      options: [
        { value: 'yes', label: 'Evet — daha önce hazırladık' },
        { value: 'no', label: 'Hayır — ilk raporumuz' },
        { value: 'skip', label: 'Atlamak istiyorum' },
      ],
      systemMessages: {
        info: ['Baz yılınızı bir sonraki adımda soracağız. Önceki raporunuzdaki veriler varsa karşılaştırmalı analiz yapabiliriz.'],
      },
    },
    en: {
      text: 'Have you prepared a carbon report before?',
      placeholder: null,
      helper: 'If you have, baseline year comparison and trend analysis will be added to your report.',
      options: [
        { value: 'yes', label: 'Yes — we have prepared one before' },
        { value: 'no', label: 'No — this is our first report' },
        { value: 'skip', label: 'Skip this question' },
      ],
      systemMessages: {
        info: ['We will ask for your baseline year in the next step. If you have data from previous reports, we can do a comparative analysis.'],
      },
    },
  },

  A7a: {
    id: 'A7a', phase: 1, block: 'A', type: 'year', required: false, next: 'B1',
    showIf: (data) => data.A7 === 'yes',
    tr: {
      text: 'Baz yılınız hangi yıl?',
      placeholder: 'Baz yılı seçin',
      helper: 'Baz yıl, emisyon trendlerinizi kıyaslayacağınız referans yıldır. Genellikle en eski güvenilir veri yılı seçilir.',
      options: [
        { value: '2015', label: '2015' }, { value: '2016', label: '2016' },
        { value: '2017', label: '2017' }, { value: '2018', label: '2018' },
        { value: '2019', label: '2019' }, { value: '2020', label: '2020' },
        { value: '2021', label: '2021' }, { value: '2022', label: '2022' },
        { value: '2023', label: '2023' }, { value: '2024', label: '2024' },
      ],
      systemMessages: {
        error: ['Baz yıl ile raporlama yılı aynı olamaz. Lütfen daha önceki bir yıl seçin.', 'Baz yıl, raporlama yılından önce olmalıdır.'],
        info: ['Baz yıl belirlendi. Bu yıla ait emisyon verilerinizi raporun sonunda girmenizi isteyeceğiz.'],
      },
    },
    en: {
      text: 'What is your baseline year?',
      placeholder: 'Select baseline year',
      helper: 'The baseline year is the reference year against which you will compare your emission trends. Typically the oldest year with reliable data.',
      options: [
        { value: '2015', label: '2015' }, { value: '2016', label: '2016' },
        { value: '2017', label: '2017' }, { value: '2018', label: '2018' },
        { value: '2019', label: '2019' }, { value: '2020', label: '2020' },
        { value: '2021', label: '2021' }, { value: '2022', label: '2022' },
        { value: '2023', label: '2023' }, { value: '2024', label: '2024' },
      ],
      systemMessages: {
        error: ['Baseline year and reporting year cannot be the same. Please select an earlier year.', 'Baseline year must be before the reporting year.'],
        info: ['Baseline year set. We will ask you to enter emission data for this year at the end of the report.'],
      },
    },
  },

  // ─────────────────────────────────────────────
  // PHASE 1 — BLOCK B · Activity Profile
  // ─────────────────────────────────────────────

  B1: {
    id: 'B1', phase: 1, block: 'B', type: 'select', required: true, next: 'B2',
    tr: {
      text: 'Şirketinizin ana sektörü nedir?',
      placeholder: 'Sektör adı veya NACE kodu yazın...',
      helper: 'NACE kodunuzu bilmiyorsanız sektörünüzü yazmaya başlayın, sistem eşleşen seçenekleri gösterir. Bu seçim hangi soruların sorulacağını belirler.',
      options: [
        { value: 'A', label: 'NACE A — Tarım, ormancılık, balıkçılık' },
        { value: 'B', label: 'NACE B — Madencilik ve taş ocakçılığı' },
        { value: 'C', label: 'NACE C — İmalat / Üretim' },
        { value: 'D', label: 'NACE D — Elektrik, gaz, buhar üretimi ve dağıtımı' },
        { value: 'E', label: 'NACE E — Su temini, kanalizasyon, atık yönetimi' },
        { value: 'F', label: 'NACE F — İnşaat' },
        { value: 'G', label: 'NACE G — Toptan ve perakende ticaret' },
        { value: 'H', label: 'NACE H — Ulaştırma ve depolama' },
        { value: 'I', label: 'NACE I — Konaklama ve yiyecek-içecek' },
        { value: 'J', label: 'NACE J — Bilgi ve iletişim / Yazılım / BT' },
        { value: 'K', label: 'NACE K — Finans ve sigortacılık' },
        { value: 'L', label: 'NACE L — Gayrimenkul faaliyetleri' },
        { value: 'M', label: 'NACE M — Mesleki, bilimsel ve teknik faaliyetler' },
        { value: 'N', label: 'NACE N — İdari ve destek hizmetleri' },
        { value: 'O', label: 'NACE O — Kamu yönetimi ve savunma' },
        { value: 'P', label: 'NACE P — Eğitim' },
        { value: 'Q', label: 'NACE Q — Sağlık ve sosyal hizmetler' },
        { value: 'R', label: 'NACE R — Kültür, sanat, eğlence' },
        { value: 'SU', label: 'NACE S–U — Diğer hizmet faaliyetleri' },
      ],
      systemMessages: {
        error: ['Lütfen şirketinizin ana sektörünü seçin.'],
        info: [
          'İmalat sektörü seçildi. Proses emisyonları dahil tüm Kapsam 1 kategorileri için sorular gelecek.',
          'Hizmet sektörü seçildi. Proses emisyon soruları atlanacak. Enerji, seyahat ve tedarik zinciri odaklı ilerleyeceğiz.',
          'Finans sektörü seçildi. Kapsam 3 Kategori 15 (Finansal Yatırımlar) için PCAF standardı uygulanacak.',
        ],
      },
    },
    en: {
      text: 'What is the primary sector of your company?',
      placeholder: 'Type sector name or NACE code...',
      helper: 'If you don\'t know your NACE code, start typing your sector and the system will show matching options. This selection determines which questions will be asked.',
      options: [
        { value: 'A', label: 'NACE A — Agriculture, forestry and fishing' },
        { value: 'B', label: 'NACE B — Mining and quarrying' },
        { value: 'C', label: 'NACE C — Manufacturing' },
        { value: 'D', label: 'NACE D — Electricity, gas, steam and air conditioning supply' },
        { value: 'E', label: 'NACE E — Water supply, sewerage, waste management' },
        { value: 'F', label: 'NACE F — Construction' },
        { value: 'G', label: 'NACE G — Wholesale and retail trade' },
        { value: 'H', label: 'NACE H — Transportation and storage' },
        { value: 'I', label: 'NACE I — Accommodation and food service' },
        { value: 'J', label: 'NACE J — Information and communication / Software / IT' },
        { value: 'K', label: 'NACE K — Financial and insurance activities' },
        { value: 'L', label: 'NACE L — Real estate activities' },
        { value: 'M', label: 'NACE M — Professional, scientific and technical activities' },
        { value: 'N', label: 'NACE N — Administrative and support service activities' },
        { value: 'O', label: 'NACE O — Public administration and defence' },
        { value: 'P', label: 'NACE P — Education' },
        { value: 'Q', label: 'NACE Q — Human health and social work activities' },
        { value: 'R', label: 'NACE R — Arts, entertainment and recreation' },
        { value: 'SU', label: 'NACE S–U — Other service activities' },
      ],
      systemMessages: {
        error: ['Please select the primary sector of your company.'],
        info: [
          'Manufacturing sector selected. Questions for all Scope 1 categories including process emissions will follow.',
          'Service sector selected. Process emission questions will be skipped. We will focus on energy, travel, and supply chain.',
          'Financial sector selected. PCAF standard will be applied for Scope 3 Category 15 (Investments).',
        ],
      },
    },
  },

  B2: {
    id: 'B2', phase: 1, block: 'B', type: 'textarea', required: true, next: 'B3',
    validation: { maxLength: 200 },
    tr: {
      text: 'Şirketinizin faaliyetini kısaca tanımlayın.',
      placeholder: 'Örn: Kurumsal eğitim ve danışmanlık hizmetleri sunuyoruz. İstanbul merkezli, yurt içi müşterilere hizmet veriyoruz.',
      helper: 'ISO 14064-1 raporunun "Kuruluş Tanımı" bölümünde aynen kullanılacak. Sade ve açıklayıcı bir cümle yeterli.',
      systemMessages: {
        error: ['Faaliyet tanımı zorunludur. Kısa bir cümle yeterli.', 'En fazla 200 karakter girebilirsiniz.'],
      },
    },
    en: {
      text: 'Briefly describe your company\'s main business activity.',
      placeholder: 'E.g.: We provide corporate training and consulting services. Headquartered in Istanbul, serving domestic clients.',
      helper: 'Will be used verbatim in the "Organization Description" section of your ISO 14064-1 report. A clear, simple sentence is sufficient.',
      systemMessages: {
        error: ['Activity description is required. A short sentence is sufficient.', 'Maximum 200 characters allowed.'],
      },
    },
  },

  B3: {
    id: 'B3', phase: 1, block: 'B', type: 'select', required: true, next: 'B4',
    tr: {
      text: 'Toplam çalışan sayınız nedir?',
      placeholder: 'Çalışan sayısı aralığını seçin',
      helper: 'Raporlama yılı sonu itibarıyla tam zamanlı eşdeğer (FTE) çalışan sayınızı seçin. Bu bilgi Kapsam 3 çalışan ulaşım hesaplarında kullanılacak.',
      options: [
        { value: 'micro', label: '1–50 çalışan' },
        { value: 'small', label: '51–250 çalışan' },
        { value: 'medium', label: '251–1.000 çalışan' },
        { value: 'large', label: '1.001–5.000 çalışan' },
        { value: 'enterprise', label: '5.000+ çalışan' },
      ],
      systemMessages: {
        error: ['Lütfen çalışan sayısı aralığını seçin.'],
        info: ['Büyük bir organizasyonunuz var. Çalışan ulaşım hesapları için lokasyon bazlı dağılım soracağız — bu daha doğru bir sonuç verecek.'],
      },
    },
    en: {
      text: 'What is your total number of employees?',
      placeholder: 'Select employee count range',
      helper: 'Select the full-time equivalent (FTE) employee count as of the end of the reporting year. This will be used for Scope 3 employee commute calculations.',
      options: [
        { value: 'micro', label: '1–50 employees' },
        { value: 'small', label: '51–250 employees' },
        { value: 'medium', label: '251–1,000 employees' },
        { value: 'large', label: '1,001–5,000 employees' },
        { value: 'enterprise', label: '5,000+ employees' },
      ],
      systemMessages: {
        error: ['Please select the employee count range.'],
        info: ['You have a large organization. We will ask for location-based distribution for employee commute calculations — this will give a more accurate result.'],
      },
    },
  },

  B4: {
    id: 'B4', phase: 1, block: 'B', type: 'number', required: true, next: 'B5',
    validation: { min: 1, max: 999 },
    tr: {
      text: 'Kaç farklı fiziksel lokasyonda faaliyet gösteriyorsunuz?',
      placeholder: 'Örn: 3',
      helper: 'Ofis, fabrika, depo, şube gibi tüm fiziksel lokasyonları sayın. Her lokasyon için ayrı emisyon verisi gireceksiniz. Bu sayı Aşama 2\'ye otomatik taşınacak.',
      systemMessages: {
        error: ['En az 1 fiziksel lokasyon girmelisiniz.', 'Lokasyon sayısı zorunludur.'],
        info: ['Çok sayıda lokasyonunuz var. Her lokasyon için tek tek veri girmek yerine Excel şablonumuzla toplu yükleme yapabilirsiniz. Devam etmek ister misiniz?'],
      },
    },
    en: {
      text: 'How many physical locations does your company operate from?',
      placeholder: 'E.g.: 3',
      helper: 'Count all physical locations such as offices, factories, warehouses, branches. You will enter separate emission data for each. This number will automatically carry over to Phase 2.',
      systemMessages: {
        error: ['You must enter at least 1 physical location.', 'Number of locations is required.'],
        info: ['You have many locations. Instead of entering data one by one, you can upload in bulk with our Excel template. Would you like to continue?'],
      },
    },
  },

  B5: {
    id: 'B5', phase: 1, block: 'B', type: 'multiselect', required: true, next: 'B6',
    tr: {
      text: 'Bu lokasyonların türleri neler?',
      placeholder: null,
      helper: 'Birden fazla seçebilirsiniz. Seçimleriniz hangi emisyon kaynaklarının sorulacağını belirler. Fabrika seçerseniz endüstriyel proses soruları eklenir, veri merkezi seçerseniz PUE sorusu gelir.',
      options: [
        { value: 'office', label: 'Ofis' },
        { value: 'factory', label: 'Fabrika / Üretim tesisi' },
        { value: 'warehouse', label: 'Depo / Lojistik merkezi' },
        { value: 'field', label: 'Saha / Açık alan operasyonu' },
        { value: 'datacenter', label: 'Veri Merkezi' },
        { value: 'retail', label: 'Perakende mağaza / Showroom' },
        { value: 'other', label: 'Diğer' },
      ],
      systemMessages: {
        error: ['Lütfen en az bir lokasyon türü seçin.'],
        info: [
          'Üretim tesisi seçildi. Endüstriyel proses emisyonları ve ağır makine kullanımı için ek sorular gelecek.',
          'Veri merkezi seçildi. Enerji verimliliği (PUE) için ek soru eklenecek — bu değer elektrik emisyonlarını doğrudan etkiler.',
        ],
      },
    },
    en: {
      text: 'What types of locations does your company operate?',
      placeholder: null,
      helper: 'You can select multiple. Your selections determine which emission sources will be asked about. Selecting factory adds industrial process questions; selecting data center adds PUE question.',
      options: [
        { value: 'office', label: 'Office' },
        { value: 'factory', label: 'Factory / Manufacturing facility' },
        { value: 'warehouse', label: 'Warehouse / Logistics center' },
        { value: 'field', label: 'Field / Open-air operations' },
        { value: 'datacenter', label: 'Data Center' },
        { value: 'retail', label: 'Retail store / Showroom' },
        { value: 'other', label: 'Other' },
      ],
      systemMessages: {
        error: ['Please select at least one location type.'],
        info: [
          'Manufacturing facility selected. Additional questions for industrial process emissions and heavy equipment will follow.',
          'Data center selected. An additional question for energy efficiency (PUE) will be added — this value directly impacts electricity emissions.',
        ],
      },
    },
  },

  B6: {
    id: 'B6', phase: 1, block: 'B', type: 'select', required: false, next: 'C1',
    tr: {
      text: 'Yıllık ciro aralığınız nedir? (Opsiyonel)',
      placeholder: 'Ciro aralığını seçin veya atlayın',
      helper: 'Bu bilgi Kapsam 3 materyalite analizi için kullanılır. Paylaşmak istemezseniz atlayabilirsiniz — yalnızca hangi kategorilerin öncelikli sorulacağını etkiler.',
      options: [
        { value: 'micro', label: '1 Milyon TL\'nin altı' },
        { value: 'small', label: '1–10 Milyon TL' },
        { value: 'medium', label: '10–100 Milyon TL' },
        { value: 'large', label: '100 Milyon – 1 Milyar TL' },
        { value: 'enterprise', label: '1 Milyar TL ve üzeri' },
        { value: 'skip', label: 'Atlamak istiyorum' },
      ],
      systemMessages: {
        info: [
          'Büyük ölçekli şirketiniz için Kapsam 3\'ün tüm 15 kategorisini değerlendirmenizi öneririz.',
          'Ciro bilgisi girilmedi. Kapsam 3 kategori önceliklendirmesi için ilerleyen adımda manuel seçim yapmanızı isteyeceğiz.',
        ],
      },
    },
    en: {
      text: 'What is your approximate annual revenue range? (Optional)',
      placeholder: 'Select revenue range or skip',
      helper: 'This information is used for Scope 3 materiality analysis. You can skip if you prefer — it only affects which categories are prioritized.',
      options: [
        { value: 'micro', label: 'Under 1 Million TRY' },
        { value: 'small', label: '1–10 Million TRY' },
        { value: 'medium', label: '10–100 Million TRY' },
        { value: 'large', label: '100 Million – 1 Billion TRY' },
        { value: 'enterprise', label: '1 Billion TRY and above' },
        { value: 'skip', label: 'Skip this question' },
      ],
      systemMessages: {
        info: [
          'For your large-scale company, we recommend evaluating all 15 Scope 3 categories.',
          'Revenue not entered. We will ask you to manually select Scope 3 category priorities in a later step.',
        ],
      },
    },
  },

  // ─────────────────────────────────────────────
  // PHASE 1 — BLOCK C · Structural Information
  // ─────────────────────────────────────────────

  C1: {
    id: 'C1', phase: 1, block: 'C', type: 'yesno', required: true, next: 'C2',
    tr: {
      text: 'Bağlı şirket veya iştirakınız var mı?',
      placeholder: null,
      helper: 'Bağlı şirket veya iştiraklerin olması durumunda her biri için organizasyon sınırı testi yapılacak. Bu ISO 14064-1\'in zorunlu kıldığı bir adım.',
      options: [
        { value: 'yes', label: 'Evet' },
        { value: 'no', label: 'Hayır' },
      ],
      systemMessages: {
        info: ['Her bağlı şirket veya iştirak için Aşama 2\'de organizasyon sınırı testi yapacağız. Bu, ISO 14064-1 §5.1\'in zorunlu kıldığı bir adım.'],
      },
    },
    en: {
      text: 'Does your company have any subsidiaries or affiliates?',
      placeholder: null,
      helper: 'If you have subsidiaries or affiliates, an organizational boundary test will be conducted for each. This is a mandatory step under ISO 14064-1.',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
      systemMessages: {
        info: ['We will conduct an organizational boundary test for each subsidiary or affiliate in Phase 2. This is a mandatory step under ISO 14064-1 §5.1.'],
      },
    },
  },

  C2: {
    id: 'C2', phase: 1, block: 'C', type: 'yesno', required: true, next: 'C3',
    tr: {
      text: 'Yurt dışında operasyonunuz var mı?',
      placeholder: null,
      helper: 'Yurt dışı tesis, şube veya çalışanınız varsa her ülke için farklı emisyon faktörleri kullanılacak. Bu özellikle elektrik emisyonlarını önemli ölçüde etkiler.',
      options: [
        { value: 'yes', label: 'Evet' },
        { value: 'no', label: 'Hayır' },
      ],
      systemMessages: {
        info: ['Yurt dışı operasyonlarınız için her ülkenin elektrik şebeke emisyon faktörü ayrıca uygulanacak.'],
      },
    },
    en: {
      text: 'Does your company have any international operations?',
      placeholder: null,
      helper: 'If you have international facilities, branches, or employees, different emission factors will be used for each country. This especially impacts electricity emissions significantly.',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
      systemMessages: {
        info: ['For your international operations, each country\'s grid electricity emission factor will be applied separately.'],
      },
    },
  },

  C3: {
    id: 'C3', phase: 1, block: 'C', type: 'yesno', required: true, next: 'D1',
    tr: {
      text: 'Franchise veya ortak girişim (JV) var mı?',
      placeholder: null,
      helper: 'Franchise veriyorsanız veya ortak girişiminiz varsa operasyonel kontrol testi gerekir. Bu, emisyonların kimin raporuna gireceğini belirler.',
      options: [
        { value: 'yes', label: 'Evet' },
        { value: 'no', label: 'Hayır' },
      ],
      systemMessages: {
        info: ['Franchise veya ortak girişimde operasyonel kontrolü elinde bulunduran taraf tüm emisyonları raporlar. Aşama 2\'de bu kontrolün kimde olduğunu birlikte belirleyeceğiz.'],
      },
    },
    en: {
      text: 'Does your company have any franchise agreements or joint ventures?',
      placeholder: null,
      helper: 'If you are a franchisor or have joint ventures, an operational control test is required. This determines whose report the emissions will appear in.',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
      systemMessages: {
        info: ['The party with operational control in a franchise or joint venture reports all emissions. We will determine who holds this control together in Phase 2.'],
      },
    },
  },

  // ─────────────────────────────────────────────
  // PHASE 1 — BLOCK D · Reporting Preferences
  // ─────────────────────────────────────────────

  D1: {
    id: 'D1', phase: 1, block: 'D', type: 'select', required: true, next: 'D2',
    tr: {
      text: 'Emisyon faktörü veritabanı tercihiniz nedir?',
      placeholder: 'Veritabanı seçin',
      helper: 'Sistem bulunduğunuz ülkeye göre en uygun veritabanını önerdi. Değiştirmeniz gerekmez ama farklı bir tercih varsa aşağıdan seçebilirsiniz. Seçiminiz raporunuzda belgelenecek.',
      options: [
        { value: 'DEFRA_TUIK', label: 'DEFRA + TÜİK kombinasyonu — [ÖNERİLEN Türkiye için]' },
        { value: 'DEFRA', label: 'DEFRA 2023 (UK — çok ülkede kabul görür)' },
        { value: 'IPCC_AR6', label: 'IPCC AR6 2021 (Uluslararası — en güncel GWP değerleri)' },
        { value: 'EPA', label: 'EPA (ABD Çevre Koruma Ajansı)' },
        { value: 'custom', label: 'Kullanıcı tanımlı faktör yükle' },
      ],
      systemMessages: {
        info: ['Türkiye seçiminiz doğrultusunda DEFRA + TÜİK kombinasyonunu önerdik. Değiştirmek ister misiniz?'],
        warning: [
          'EPA veritabanı ABD bazlı faktörler içerir. Türkiye\'deki operasyonlarınız için bazı değerler uygun olmayabilir.',
          'Özel emisyon faktörü yükleyeceksiniz. Kullandığınız kaynağı ve hangi kategoriler için kullandığınızı belirtmeniz önemli.',
        ],
        error: ['Lütfen bir emisyon faktörü veritabanı seçin.'],
      },
    },
    en: {
      text: 'Which emission factor database would you like to use?',
      placeholder: 'Select database',
      helper: 'The system recommended the most appropriate database based on your country. No need to change it, but you can select a different preference below. Your selection will be documented in the report.',
      options: [
        { value: 'DEFRA_TUIK', label: 'DEFRA + TÜİK combination — [RECOMMENDED for Turkey]' },
        { value: 'DEFRA', label: 'DEFRA 2023 (UK — accepted in many countries)' },
        { value: 'IPCC_AR6', label: 'IPCC AR6 2021 (International — latest GWP values)' },
        { value: 'EPA', label: 'EPA (US Environmental Protection Agency)' },
        { value: 'custom', label: 'Upload custom emission factor' },
      ],
      systemMessages: {
        info: ['Based on your Turkey selection, we recommended DEFRA + TÜİK combination. Would you like to change it?'],
        warning: [
          'EPA database contains US-based factors. Some values may not be appropriate for your Turkish operations.',
          'You will upload a custom emission factor. It is important to specify the source and which categories it applies to.',
        ],
        error: ['Please select an emission factor database.'],
      },
    },
  },

  D2: {
    id: 'D2', phase: 1, block: 'D', type: 'info', required: false, next: 'D3',
    tr: {
      text: 'Kapsam 2 Hesaplama Metodolojisi',
      placeholder: null,
      helper: null,
      options: [{ value: 'continue', label: 'Anladım, devam ediyorum' }],
      systemMessages: {
        info: ['Bu versiyon yalnızca location-based (konum bazlı) Kapsam 2 metodolojisini desteklemektedir. Bu yöntemde elektrik emisyonları, tesisinizin bulunduğu bölgenin ortalama şebeke emisyon faktörü kullanılarak hesaplanır. Market-based metodoloji ileride eklenecektir.'],
      },
    },
    en: {
      text: 'Scope 2 Calculation Methodology',
      placeholder: null,
      helper: null,
      options: [{ value: 'continue', label: 'Understood, continue' }],
      systemMessages: {
        info: ['This version only supports the location-based Scope 2 methodology. In this method, electricity emissions are calculated using the average grid emission factor for the region where your facility is located. Market-based methodology will be added in a future version.'],
      },
    },
  },

  D3: {
    id: 'D3', phase: 1, block: 'D', type: 'select', required: true, next: 'D4',
    tr: {
      text: 'Organizasyon sınırı raporlama yaklaşımı nedir?',
      placeholder: null,
      helper: 'Bu seçim hangi tesislerinizin ve bağlı şirketlerinizin rapora dahil edileceğini belirler. Emin değilseniz "Operasyonel Kontrol" ile devam edin — en yaygın kullanılan yaklaşım budur.',
      options: [
        { value: 'operational_control', label: 'Operasyonel Kontrol (Önerilen) — Operasyonel politikaları siz belirleyen tüm tesisler dahil edilir.' },
        { value: 'financial_control', label: 'Finansal Kontrol — Finansal ve operasyonel politikaları yönetme yetkisi olduğunuz birimler dahil edilir.' },
        { value: 'equity_share', label: 'Hisse Payı — Her tesisten hisse oranınız kadar emisyon payı alınır. Ortak girişimlerde kullanılır.' },
      ],
      systemMessages: {
        error: ['Lütfen organizasyon sınırı yaklaşımını seçin. Emin değilseniz "Operasyonel Kontrol" ile devam edebilirsiniz.'],
        info: ['Hisse Payı yaklaşımı seçildi. Her tesis ve bağlı şirket için hisse oranınızı girmenizi isteyeceğiz.'],
        warning: ['Bu seçimi değiştirmek Aşama 2\'deki tüm sınır testlerini sıfırlayacak. Devam etmek istediğinizden emin misiniz?'],
      },
    },
    en: {
      text: 'Which organizational boundary approach will you use?',
      placeholder: null,
      helper: 'This selection determines which of your facilities and subsidiaries will be included in the report. If unsure, continue with "Operational Control" — it is the most commonly used approach.',
      options: [
        { value: 'operational_control', label: 'Operational Control (Recommended) — All facilities where you set operational policies are included.' },
        { value: 'financial_control', label: 'Financial Control — Units where you have authority to direct financial and operational policies.' },
        { value: 'equity_share', label: 'Equity Share — A proportionate share of emissions is taken from each facility based on your ownership percentage.' },
      ],
      systemMessages: {
        error: ['Please select the organizational boundary approach. If unsure, you can continue with "Operational Control".'],
        info: ['Equity Share approach selected. We will ask you to enter your ownership percentage for each facility and subsidiary.'],
        warning: ['Changing this selection will reset all boundary tests in Phase 2. Are you sure you want to continue?'],
      },
    },
  },

  D4: {
    id: 'D4', phase: 1, block: 'D', type: 'select', required: true, next: '2A-0',
    tr: {
      text: 'Kapsam 3 kapsamını nasıl belirlemek istersiniz?',
      placeholder: null,
      helper: 'Materyalite bazlı yaklaşım şirketinize en önemli kategorileri öne çıkarır — daha hızlı ve verimli. Tam 15 kategori ise kapsamlı ama daha uzun sürer.',
      options: [
        { value: 'materiality', label: 'Materyalite Bazlı (Önerilen) — Sektörünüz ve büyüklüğünüze göre materyel kategoriler öne çıkar. Daha hızlı ve pratik.' },
        { value: 'full', label: 'Tam 15 Kategori — Kapsam 3\'ün tüm 15 kategorisi eksiksiz sorulur. Daha kapsamlı rapor, daha uzun sürer.' },
      ],
      systemMessages: {
        error: ['Lütfen Kapsam 3 yaklaşımını seçin.'],
        warning: ['Ciro bilgisi girilmediğinden materyalite hesabı sınırlı olacak. Yine de devam edebilirsiniz.'],
        info: ['Tüm 15 Kapsam 3 kategorisi sorulacak. Veri olmayan kategorileri atlayabilir veya "veri yok" olarak işaretleyebilirsiniz.'],
        success: ['Harika! Aşama 1 tamamlandı. Şimdi organizasyon sınırınızı belirlemek için Aşama 2\'ye geçiyoruz. 🎉'],
      },
    },
    en: {
      text: 'How would you like to determine the scope of your Scope 3 reporting?',
      placeholder: null,
      helper: 'The materiality-based approach highlights the most important categories for your company — faster and more efficient. Full 15 categories is comprehensive but takes longer.',
      options: [
        { value: 'materiality', label: 'Materiality-Based (Recommended) — Material categories highlighted based on your sector and size. Faster and more practical.' },
        { value: 'full', label: 'Full 15 Categories — All 15 Scope 3 categories asked in full. More comprehensive report, takes longer.' },
      ],
      systemMessages: {
        error: ['Please select the Scope 3 approach.'],
        warning: ['Since revenue information was not entered, materiality calculation will be limited. You can still continue.'],
        info: ['All 15 Scope 3 categories will be asked. You can skip categories with no data or mark them as "no data".'],
        success: ['Excellent! Phase 1 complete. Now moving to Phase 2 to define your organizational boundary. 🎉'],
      },
    },
  },
};

/**
 * Format question as a chat message string
 */
function formatQuestion(questionId, lang = 'tr', questionNumber = null, totalQuestions = 133) {
  const q = QUESTIONS[questionId];
  if (!q) return null;

  const content = q[lang] || q.tr;
  const isEn = lang === 'en';

  const lines = [];

  // Progress indicator
  if (questionNumber) {
    lines.push(isEn
      ? `*Phase ${q.phase} · Question ${questionNumber}/${totalQuestions}*`
      : `*Aşama ${q.phase} · Soru ${questionNumber}/${totalQuestions}*`
    );
    lines.push('');
  }

  // Question text (bold)
  lines.push(`**${content.text}**`);

  // Helper text (italic)
  if (content.helper) {
    lines.push('');
    lines.push(`*${content.helper}*`);
  }

  // Options for select/multiselect/yesno
  if (content.options && content.options.length > 0 && q.type !== 'info') {
    lines.push('');
    content.options.forEach((opt, i) => {
      lines.push(`${i + 1}. ${opt.label}`);
    });
  }

  // Info screen message
  if (q.type === 'info' && content.systemMessages?.info?.[0]) {
    lines.push('');
    lines.push(`ℹ️ ${content.systemMessages.info[0]}`);
    lines.push('');
    if (content.options?.[0]) {
      lines.push(`→ *${content.options[0].label}*`);
    }
  }

  return lines.join('\n');
}

/**
 * Get welcome message for chatbot
 */
function getWelcomeMessage(lang = 'tr') {
  if (lang === 'en') {
    return `Hello! 🌿 I'm **CarbonIQ**, your ISO 14064-1 compliant carbon footprint reporting assistant.

Together we'll prepare your company's carbon report through **7 phases** and **133 questions**.

**What to expect:**
- ✅ Phase 1 — Company identification (21 questions)
- ✅ Phase 2 — Organizational boundary (14 questions)
- ✅ Phase 3–5 — Scope 1, 2 & 3 emissions (72 questions)
- ✅ Phase 6 — Assumptions & exclusions (27 questions)
- ✅ Phase 7 — Report generation (5 questions)

You can type your answers or select from the numbered options. At any time, type **"help"** for guidance or **"back"** to go to the previous question.

Let's get started! 🚀`;
  }

  return `Merhaba! 🌿 Ben **CarbonIQ**, ISO 14064-1 uyumlu karbon ayak izi raporlama asistanınızım.

Şirketinizin karbon raporunu birlikte **7 aşama** ve **133 soru** ile hazırlayacağız.

**Süreç şöyle ilerleyecek:**
- ✅ Aşama 1 — Şirketi tanıma (21 soru)
- ✅ Aşama 2 — Organizasyon sınırı (14 soru)
- ✅ Aşama 3–5 — Kapsam 1, 2 ve 3 emisyonları (72 soru)
- ✅ Aşama 6 — Kabuller ve hariç tutmalar (27 soru)
- ✅ Aşama 7 — Rapor oluşturma (5 soru)

Yanıtlarınızı yazabilir veya numaralı seçeneklerden birini seçebilirsiniz. İstediğiniz zaman **"yardım"** yazarak rehberlik alabilir, **"geri"** yazarak önceki soruya dönebilirsiniz.

Başlayalım! 🚀`;
}

module.exports = { QUESTIONS, formatQuestion, getWelcomeMessage };
