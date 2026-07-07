// app.js - Controller for Demon King's Butler Web Reader

// State
let state = {
  currentChapterIndex: 0,
  theme: localStorage.getItem('novel-theme') || 'dark',
  fontSize: parseInt(localStorage.getItem('novel-font-size')) || 18,
  fontFamily: localStorage.getItem('novel-font-family') || 'Sarabun',
  lineHeight: parseFloat(localStorage.getItem('novel-line-height')) || 1.8,
  readerWidth: parseInt(localStorage.getItem('novel-reader-width')) || 760,
  view: 'home',
  scrollPositions: JSON.parse(localStorage.getItem('novel-scroll-positions') || '{}'),
  ttsPlaying: false,
  ttsIndex: 0,
  ttsRate: parseFloat(localStorage.getItem('novel-tts-rate')) || 1.0,
  ttsUtterance: null,
  ttsVoiceName: localStorage.getItem('novel-tts-voice') || ''
};

// Character Profiles Data
const characters = [
  {
    name: "มาโอะ (Mao)",
    role: "อดีตมหาจอมมาร / พ่อบ้านสุดน่ารัก",
    image: "assets/mao.jpg",
    desc: "อดีตราชาปิศาจผู้ปกครองมิติมืด หลังจากพ่ายแพ้(?)ให้แก่ผู้กล้า ยูคิฮิโระ เขาได้ตกลงข้ามมิติมายังโลกมนุษย์และถูกแปลงโฉมให้กลายเป็นเด็กหนุ่มผมเงินร่างเล็กผู้น่ารัก คอยทำหน้าที่เป็นพ่อบ้านประจำตัวของคุณหนูยูคิฮิโระ แม้จะซื่อบื้อเรื่องเทคโนโลยีแต่ความภักดีและฝีมือการต่อสู้ระดับไร้เทียมทาน!"
  },
  {
    name: "ยูคิฮิโระ (Yukihiro)",
    role: "คุณหนูอัจฉริยะ / อดีตผู้กล้า",
    image: "assets/yukihiro.jpg",
    desc: "คุณชายทายาทตระกูลลับผู้ทรงอิทธิพลเบื้องหลังความมั่นคงของประเทศ และเป็นผู้กล้าที่เคยถูกอัญเชิญไปต่างโลกเพื่อปราบจอมมาร ยูคิฮิโระเป็นนักเรียนระดับท็อปของชั้นปีที่ฉลาดและเจ้าเล่ห์ ยอมเหน็ดเหนื่อยแบกรับตารางฝึกฝนและภารกิจหนักอึ้ง เพียงเพื่อสร้างบารมีที่จะปกป้องจอมมารที่เขานำกลับมาด้วย"
  },
  {
    name: "คิริว (Kiryu)",
    role: "อดีตหัวหน้าแยงกี้ / ทายาทแก๊งยากูซ่า",
    image: "assets/kiryu.jpg",
    desc: "เพื่อนร่วมชั้นคนแรกของมาโอะ ทายาทแก๊งยากูซ่าผู้มีประวัติเป็นหัวโจกนักเลงโรงเรียน คิริวมีหน้าตาดุดันแต่จริงๆ แล้วเป็นคนรักพวกพ้องและมีน้ำใจมาก เขาเป็นผู้คอยเปิดโลกและสอนการใช้ชีวิตมนุษย์ธรรมดาให้มาโอะ และยังคอยทำหน้าที่เป็นกัปตันเรือคอยพายเรือและช่วยเชียร์ความสัมพันธ์ของคุณหนูกับพ่อบ้าน"
  }
];

// DOM Elements
const el = {
  themeDotDark: document.getElementById('theme-dot-dark'),
  themeDotLight: document.getElementById('theme-dot-light'),
  themeDotSepia: document.getElementById('theme-dot-sepia'),
  btnHome: document.getElementById('btn-home'),
  btnChapters: document.getElementById('btn-chapters'),
  btnBehind: document.getElementById('btn-behind'),
  btnStartRead: document.getElementById('btn-start-read'),
  sectionHome: document.getElementById('section-home'),
  sectionChapters: document.getElementById('section-chapters'),
  sectionBehind: document.getElementById('section-behind'),
  sectionReader: document.getElementById('section-reader'),
  chaptersGrid: document.getElementById('chapters-grid'),
  charactersGrid: document.getElementById('characters-grid'),
  searchInput: document.getElementById('search-input'),
  readerContent: document.getElementById('reader-content'),
  readerChapterNum: document.getElementById('reader-chapter-num'),
  readerChapterTitle: document.getElementById('reader-chapter-title'),
  btnPrev: document.getElementById('btn-prev'),
  btnNext: document.getElementById('btn-next'),
  btnBackHome: document.getElementById('btn-back-home'),
  btnFontDec: document.getElementById('btn-font-dec'),
  btnFontInc: document.getElementById('btn-font-inc'),
  fontFamilySelect: document.getElementById('font-family-select'),
  widthSlider: document.getElementById('width-slider'),
  
  // Toast
  resumeToast: document.getElementById('resume-toast'),
  resumeToastTitle: document.getElementById('resume-toast-title'),
  btnResumeAccept: document.getElementById('btn-resume-accept'),
  btnResumeDecline: document.getElementById('btn-resume-decline'),
  
  // TTS Controls
  btnTtsPlay: document.getElementById('btn-tts-play'),
  btnTtsStop: document.getElementById('btn-tts-stop'),
  ttsRateSelect: document.getElementById('tts-rate-select'),
  ttsVoiceSelect: document.getElementById('tts-voice-select')
};

// Initialize Application
function init() {
  // Apply initial theme
  applyTheme(state.theme);
  applyFontSize(state.fontSize);
  applyFontFamily(state.fontFamily);
  applyReaderWidth(state.readerWidth);
  if (el.fontFamilySelect) el.fontFamilySelect.value = state.fontFamily;
  if (el.widthSlider) el.widthSlider.value = state.readerWidth;
  if (el.ttsRateSelect) el.ttsRateSelect.value = state.ttsRate.toString();
  
  // Populate TTS voices
  populateTtsVoices();
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = populateTtsVoices;
  }

  // Render lists
  renderCharacters();
  renderChaptersList(novelChapters);

  // Setup Event Listeners
  setupEventListeners();

  // Check for saved progress
  checkLastReadProgress();
}

// Event Listeners
function setupEventListeners() {
  // Navigation
  el.btnHome.addEventListener('click', () => showSection('home'));
  el.btnChapters.addEventListener('click', () => showSection('chapters'));
  if (el.btnBehind) {
    el.btnBehind.addEventListener('click', () => showSection('behind'));
  }
  el.btnBackHome.addEventListener('click', () => showSection('home'));
  
  if (el.btnStartRead) {
    el.btnStartRead.addEventListener('click', () => {
      // Start from chapter 0 or saved progress
      const lastRead = localStorage.getItem('novel-last-read-index');
      if (lastRead !== null) {
        loadChapter(parseInt(lastRead));
      } else {
        loadChapter(0);
      }
    });
  }

  // Chapter Search
  el.searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = novelChapters.filter(ch => 
      ch.title.toLowerCase().includes(query) || 
      ch.paragraphs.some(p => p.toLowerCase().includes(query))
    );
    renderChaptersList(filtered);
  });

  // Chapter reader controls
  el.btnPrev.addEventListener('click', () => {
    if (state.currentChapterIndex > 0) {
      loadChapter(state.currentChapterIndex - 1);
    }
  });

  el.btnNext.addEventListener('click', () => {
    if (state.currentChapterIndex < novelChapters.length - 1) {
      loadChapter(state.currentChapterIndex + 1);
    }
  });

  // Themes
  el.themeDotDark.addEventListener('click', () => applyTheme('dark'));
  el.themeDotLight.addEventListener('click', () => applyTheme('light'));
  el.themeDotSepia.addEventListener('click', () => applyTheme('sepia'));

  // Font size
  el.btnFontDec.addEventListener('click', () => applyFontSize(state.fontSize - 2));
  el.btnFontInc.addEventListener('click', () => applyFontSize(state.fontSize + 2));

  // Font family
  el.fontFamilySelect.addEventListener('change', (e) => applyFontFamily(e.target.value));

  // Width
  el.widthSlider.addEventListener('input', (e) => applyReaderWidth(parseInt(e.target.value)));

  // Resume reading toast
  el.btnResumeAccept.addEventListener('click', () => {
    const lastRead = localStorage.getItem('novel-last-read-index');
    if (lastRead !== null) {
      loadChapter(parseInt(lastRead), true);
    }
    hideResumeToast();
  });

  el.btnResumeDecline.addEventListener('click', () => {
    hideResumeToast();
  });

  // Save scroll position as user reads
  window.addEventListener('scroll', debounce(() => {
    if (state.view === 'reader') {
      const scrollPos = window.scrollY;
      state.scrollPositions[state.currentChapterIndex] = scrollPos;
      localStorage.setItem('novel-scroll-positions', JSON.stringify(state.scrollPositions));
    }
  }, 100));

  // TTS Listeners
  if (el.btnTtsPlay) {
    el.btnTtsPlay.addEventListener('click', () => playTTS());
  }
  if (el.btnTtsStop) {
    el.btnTtsStop.addEventListener('click', () => stopTTS());
  }
  if (el.ttsRateSelect) {
    el.ttsRateSelect.addEventListener('change', (e) => {
      state.ttsRate = parseFloat(e.target.value);
      localStorage.setItem('novel-tts-rate', e.target.value);
      if (state.ttsPlaying && !window.speechSynthesis.paused) {
        const paragraphs = el.readerContent.querySelectorAll('p');
        stopTTS();
        state.ttsPlaying = true;
        el.btnTtsPlay.innerText = '⏸️';
        el.btnTtsPlay.title = 'พักเสียงอ่าน';
        el.btnTtsStop.style.display = 'inline-flex';
        speakParagraph(state.ttsIndex, paragraphs);
      }
    });
  }
  if (el.ttsVoiceSelect) {
    el.ttsVoiceSelect.addEventListener('change', (e) => {
      state.ttsVoiceName = e.target.value;
      localStorage.setItem('novel-tts-voice', e.target.value);
      if (state.ttsPlaying) {
        const paragraphs = el.readerContent.querySelectorAll('p');
        stopTTS();
        state.ttsPlaying = true;
        el.btnTtsPlay.innerText = '⏸️';
        el.btnTtsPlay.title = 'พักเสียงอ่าน';
        el.btnTtsStop.style.display = 'inline-flex';
        speakParagraph(state.ttsIndex, paragraphs);
      }
    });
  }
}

// Renderers
function renderCharacters() {
  if (!el.charactersGrid) return;
  el.charactersGrid.innerHTML = characters.map(char => `
    <div class="character-card">
      <div class="char-img-wrapper">
        <img class="char-img" src="${char.image}" alt="${char.name}" onerror="this.src='https://placehold.co/300x300/311e43/ea80fc?text=${encodeURIComponent(char.name)}'">
      </div>
      <div class="char-info">
        <h3 class="char-name">${char.name}</h3>
        <div class="char-role">${char.role}</div>
        <p class="char-desc">${char.desc}</p>
      </div>
    </div>
  `).join('');
}

function renderChaptersList(chaptersArray) {
  if (!el.chaptersGrid) return;
  
  if (chaptersArray.length === 0) {
    el.chaptersGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">ไม่พบตอนที่ค้นหา</div>`;
    return;
  }

  el.chaptersGrid.innerHTML = chaptersArray.map((ch, idx) => {
    // Find absolute index in main novelChapters array
    const absoluteIndex = novelChapters.findIndex(c => c.title === ch.title);
    return `
      <a href="#" class="chapter-card-link" data-idx="${absoluteIndex}">
        <span class="chapter-number">ตอนที่ ${absoluteIndex + 1}</span>
        <span class="chapter-title">${ch.title}</span>
      </a>
    `;
  }).join('');

  // Add click events to chapter list cards
  el.chaptersGrid.querySelectorAll('.chapter-card-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const idx = parseInt(link.getAttribute('data-idx'));
      loadChapter(idx);
    });
  });
}

// Navigation & Actions
function showSection(sectionName) {
  state.view = sectionName;
  
  // Stop TTS when leaving the reader
  stopTTS();
  
  // Toggle navigation buttons active state
  el.btnHome.classList.toggle('active', sectionName === 'home');
  el.btnChapters.classList.toggle('active', sectionName === 'chapters');
  if (el.btnBehind) {
    el.btnBehind.classList.toggle('active', sectionName === 'behind');
  }

  // Toggle sections display
  el.sectionHome.classList.toggle('active', sectionName === 'home');
  el.sectionChapters.classList.toggle('active', sectionName === 'chapters');
  if (el.sectionBehind) {
    el.sectionBehind.classList.toggle('active', sectionName === 'behind');
  }
  el.sectionReader.classList.toggle('active', sectionName === 'reader');
  
  // Scroll to top
  window.scrollTo(0, 0);
}

function loadChapter(index, restoreScroll = false) {
  if (index < 0 || index >= novelChapters.length) return;
  
  // Stop TTS on chapter change
  stopTTS();
  
  state.currentChapterIndex = index;
  localStorage.setItem('novel-last-read-index', index.toString());
  
  const ch = novelChapters[index];
  
  // Render chapter title & content
  el.readerChapterNum.innerText = `ตอนที่ ${index + 1}`;
  el.readerChapterTitle.innerText = ch.title;
  
  // Format paragraphs
  el.readerContent.innerHTML = ch.paragraphs.map(p => `<p>${p}</p>`).join('');
  
  // Setup previous/next buttons
  el.btnPrev.style.visibility = index === 0 ? 'hidden' : 'visible';
  el.btnNext.innerText = index === novelChapters.length - 1 ? 'จบเรื่อง' : 'ตอนถัดไป ➔';
  
  showSection('reader');
  
  // Restore scroll position
  if (restoreScroll && state.scrollPositions[index]) {
    setTimeout(() => {
      window.scrollTo(0, state.scrollPositions[index]);
    }, 100);
  }
}

// Progress Bookmarking
function checkLastReadProgress() {
  const lastReadIndex = localStorage.getItem('novel-last-read-index');
  if (lastReadIndex !== null) {
    const idx = parseInt(lastReadIndex);
    if (idx >= 0 && idx < novelChapters.length) {
      el.resumeToastTitle.innerText = `อ่านค้างไว้ที่ ตอนที่ ${idx + 1}`;
      showResumeToast();
    }
  }
}

function showResumeToast() {
  el.resumeToast.style.display = 'block';
}

function hideResumeToast() {
  el.resumeToast.style.display = 'none';
}

// Customizer Options
function applyTheme(themeName) {
  state.theme = themeName;
  document.documentElement.setAttribute('data-theme', themeName);
  localStorage.setItem('novel-theme', themeName);
  
  // Update theme dots active class
  el.themeDotDark.classList.toggle('active', themeName === 'dark');
  el.themeDotLight.classList.toggle('active', themeName === 'light');
  el.themeDotSepia.classList.toggle('active', themeName === 'sepia');
}

function applyFontSize(size) {
  if (size < 14 || size > 32) return;
  state.fontSize = size;
  el.readerContent.style.fontSize = `${size}px`;
  localStorage.setItem('novel-font-size', size.toString());
}

function applyFontFamily(font) {
  state.fontFamily = font;
  el.readerContent.style.fontFamily = `'${font}', sans-serif`;
  localStorage.setItem('novel-font-family', font);
}

function applyReaderWidth(width) {
  if (width < 500 || width > 1000) return;
  state.readerWidth = width;
  document.documentElement.style.setProperty('--reader-width', `${width}px`);
  localStorage.setItem('novel-reader-width', width.toString());
}

// Text-to-Speech (TTS) Functions
function populateTtsVoices() {
  if (!('speechSynthesis' in window) || !el.ttsVoiceSelect) return;
  
  const voices = window.speechSynthesis.getVoices();
  const thaiVoices = voices.filter(v => v.lang.includes('th') || v.lang.includes('TH'));
  
  el.ttsVoiceSelect.innerHTML = '<option value="">(อัตโนมัติ)</option>';
  
  thaiVoices.forEach(voice => {
    const option = document.createElement('option');
    option.value = voice.name;
    let displayName = voice.name
      .replace('Microsoft', 'MS')
      .replace('Google', 'Google')
      .replace('Desktop', '')
      .replace('Natural', 'ธรรมชาติ');
    option.innerText = displayName;
    if (voice.name === state.ttsVoiceName) {
      option.selected = true;
    }
    el.ttsVoiceSelect.appendChild(option);
  });
}

function preprocessTextForTTS(text) {
  let cleaned = text;
  
  // Clean English words / abbreviations
  cleaned = cleaned.replace(/\bAI\b/gi, " เอไอ ");
  cleaned = cleaned.replace(/\bBL\b/gi, " บีแอล ");
  cleaned = cleaned.replace(/\bVIP\b/gi, " วีไอพี ");
  cleaned = cleaned.replace(/\bHP\b/gi, " เอชพี ");
  cleaned = cleaned.replace(/\boak\b/gi, " โอ๊ค ");
  cleaned = cleaned.replace(/\bMedium Rare\b/gi, " มีเดียมแรร์ ");
  
  // Clean Thai abbreviations
  cleaned = cleaned.replace(/ม\.ปลาย/g, " มัธยมปลาย ");
  cleaned = cleaned.replace(/ม\.ต้น/g, " มัธยมต้น ");
  cleaned = cleaned.replace(/ม\.(\d+)/g, " มัธยม $1 ");
  
  // Natural pronunciation pauses
  cleaned = cleaned.replace(/ยูคิฮิโระ/g, " ยูคิฮิโระ ");
  cleaned = cleaned.replace(/มาโอะ/g, " มาโอะ ");
  cleaned = cleaned.replace(/คิริว/g, " คิริว ");
  cleaned = cleaned.replace(/ทานากะ/g, " ทานากะ ");
  
  // Use spaces/commas to force natural breathing pauses in Thai speech engines
  cleaned = cleaned.replace(/\.{3,}/g, " , ");
  cleaned = cleaned.replace(/\"|“|”/g, " , ");
  cleaned = cleaned.replace(/!|！/g, " ! ");
  cleaned = cleaned.replace(/\?/g, " ? ");
  
  return cleaned;
}

function playTTS() {
  if ('speechSynthesis' in window) {
    if (window.speechSynthesis.paused && state.ttsPlaying) {
      window.speechSynthesis.resume();
      el.btnTtsPlay.innerText = '⏸️';
      el.btnTtsPlay.title = 'พักเสียงอ่าน';
      return;
    }

    if (state.ttsPlaying && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      el.btnTtsPlay.innerText = '🔊';
      el.btnTtsPlay.title = 'ฟังเสียงอ่านต่อ';
      return;
    }

    // Start fresh
    stopTTS();
    
    const paragraphs = el.readerContent.querySelectorAll('p');
    if (paragraphs.length === 0) return;

    state.ttsPlaying = true;
    el.btnTtsPlay.innerText = '⏸️';
    el.btnTtsPlay.title = 'พักเสียงอ่าน';
    el.btnTtsStop.style.display = 'inline-flex';

    speakParagraph(state.ttsIndex, paragraphs);
  } else {
    alert('เบราว์เซอร์ของคุณไม่รองรับการอ่านออกเสียงระบบ TTS');
  }
}

function speakParagraph(index, paragraphs) {
  if (!state.ttsPlaying || index >= paragraphs.length) {
    stopTTS();
    return;
  }

  state.ttsIndex = index;
  
  // Clear previous highlights
  paragraphs.forEach(p => p.classList.remove('reading-highlight'));
  
  // Add highlight to current paragraph
  const p = paragraphs[index];
  p.classList.add('reading-highlight');
  
  // Auto-scroll paragraph into view smoothly
  p.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const rawText = p.innerText;
  const text = preprocessTextForTTS(rawText);
  
  state.ttsUtterance = new SpeechSynthesisUtterance(text);
  state.ttsUtterance.lang = 'th-TH';
  state.ttsUtterance.rate = state.ttsRate;

  // Voice setup
  const voices = window.speechSynthesis.getVoices();
  let selectedVoice = null;
  
  if (state.ttsVoiceName) {
    selectedVoice = voices.find(v => v.name === state.ttsVoiceName);
  }
  
  if (!selectedVoice) {
    // Attempt to find smooth Microsoft Online or Google natural voices
    selectedVoice = voices.find(v => v.name.includes('Online') && (v.lang.includes('th') || v.lang.includes('TH')));
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.includes('th') || v.lang.includes('TH'));
    }
  }
  
  if (selectedVoice) {
    state.ttsUtterance.voice = selectedVoice;
  }

  state.ttsUtterance.onend = () => {
    if (state.ttsPlaying) {
      speakParagraph(index + 1, paragraphs);
    }
  };

  state.ttsUtterance.onerror = (e) => {
    console.error('TTS Error:', e);
    if (e.error !== 'interrupted') {
      stopTTS();
    }
  };

  window.speechSynthesis.speak(state.ttsUtterance);
}

function stopTTS() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  
  state.ttsPlaying = false;
  state.ttsIndex = 0;
  
  if (el.btnTtsPlay) {
    el.btnTtsPlay.innerText = '🔊';
    el.btnTtsPlay.title = 'ฟังเสียงอ่าน';
  }
  if (el.btnTtsStop) {
    el.btnTtsStop.style.display = 'none';
  }
  
  if (el.readerContent) {
    el.readerContent.querySelectorAll('p').forEach(p => p.classList.remove('reading-highlight'));
  }
}

// Helpers
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Run init on load
window.addEventListener('DOMContentLoaded', init);
