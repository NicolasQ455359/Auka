/* ═══════════════════════════════════════════════════
   AUKA — Presentación Interactiva
   Interactive Logic: Simulator, PechaKucha, Pitch
   ═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── PARTICLES ──────────────────────────────────
  const particlesContainer = document.getElementById('particles');
  if (particlesContainer) {
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (8 + Math.random() * 12) + 's';
      p.style.animationDelay = (Math.random() * 10) + 's';
      p.style.width = (2 + Math.random() * 4) + 'px';
      p.style.height = p.style.width;
      p.style.opacity = (.1 + Math.random() * .3).toFixed(2);
      particlesContainer.appendChild(p);
    }
  }

  // ── NAV SCROLL EFFECT ──────────────────────────
  const nav = document.getElementById('mainNav');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });

  hamburger?.addEventListener('click', () => {
    navLinks.classList.toggle('mobile-open');
  });

  // Close mobile menu on link click
  navLinks?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('mobile-open');
    });
  });

  // Active nav link on scroll
  const sections = document.querySelectorAll('.section[id], .hero[id]');
  const navAnchors = navLinks?.querySelectorAll('a[data-section]');

  function updateActiveNav() {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 120;
      if (window.scrollY >= top) current = section.id;
    });
    navAnchors?.forEach(a => {
      a.classList.toggle('active', a.dataset.section === current);
    });
  }
  window.addEventListener('scroll', updateActiveNav);

  // ── REVEAL ON SCROLL ───────────────────────────
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(el => revealObserver.observe(el));

  // ── PHONE SIMULATOR ───────────────────────────
  let currentScreen = 0;
  const totalScreens = 5;
  const screens = document.querySelectorAll('.screen');
  const dots = document.querySelectorAll('.sim-dot');
  const simLabel = document.getElementById('simLabel');

  const screenLabels = [
    { title: 'Pantalla 1 — Bienvenida', desc: 'Auka da la bienvenida y genera confianza desde el primer momento, explicando que es un espacio seguro y privado.' },
    { title: 'Pantalla 2 — Chat', desc: 'Conversación cercana y empática con opciones rápidas de emociones y mensajes adaptados al lenguaje del joven rural.' },
    { title: 'Pantalla 3 — Ejercicio de Regulación', desc: 'Auka propone ejercicios prácticos y breves para manejar la ansiedad o el estrés, disponibles también sin conexión.' },
    { title: 'Pantalla 4 — Ruta de Ayuda', desc: 'Con consentimiento, Auka canaliza al joven con profesionales o centros de salud cercanos y genera alertas prioritarias.' },
    { title: 'Pantalla 5 — Modo Comunidad / Offline', desc: 'Acceso a contenido audiovisual y actividades comunitarias que fortalecen el bienestar y conexión, incluso sin internet.' }
  ];

  function goToScreen(index) {
    if (index < 0 || index >= totalScreens) return;
    // Stop breathing audio/timer if leaving the exercise screen
    if (index !== 2 && typeof stopBreathingTimer === 'function' && breathRunning) {
      stopBreathingTimer();
    }
    screens.forEach((s, i) => {
      s.classList.remove('active', 'exit-left');
      if (i < index) s.classList.add('exit-left');
    });
    screens[index].classList.add('active');
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    currentScreen = index;
    if (simLabel) {
      simLabel.querySelector('h4').textContent = screenLabels[index].title;
      simLabel.querySelector('p').textContent = screenLabels[index].desc;
    }
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => goToScreen(parseInt(dot.dataset.screen)));
  });

  document.getElementById('simPrev')?.addEventListener('click', () => goToScreen(currentScreen - 1));
  document.getElementById('simNext')?.addEventListener('click', () => goToScreen(currentScreen + 1));

  // Internal phone navigation (data-goto buttons)
  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => goToScreen(parseInt(btn.dataset.goto)));
  });

  // Conversar button → go to chat
  document.getElementById('btnConversar')?.addEventListener('click', () => goToScreen(1));

  // Connect button feedback
  document.getElementById('btnConnect')?.addEventListener('click', function() {
    this.textContent = '✓ Solicitud enviada';
    this.style.background = 'linear-gradient(135deg, #245233, #3a8452)';
    setTimeout(() => {
      this.textContent = 'Sí, conectar ahora ➤';
      this.style.background = '';
    }, 2000);
  });

  // ── CHAT SIMULATION ───────────────────────────
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const emotionBtns = document.getElementById('emotionBtns');
  const chatResetBtn = document.getElementById('chatResetBtn');
  let chatTimeouts = [];

  const botResponses = {
    feliz: 'Me alegra mucho que te sientas bien hoy. 😊 ¿Quieres contarme más sobre qué te hace sentir así?',
    triste: 'Gracias por confiar en mí. 💚 Cuéntame más sobre lo que te está pasando, estoy aquí para escucharte.',
    ansioso: 'Entiendo que la ansiedad puede ser difícil. ¿Te gustaría probar un ejercicio de respiración para calmarte un poco? 🧘',
    enojado: 'Está bien sentir enojo. A veces necesitamos soltar. ¿Quieres contarme qué te tiene así? Estoy aquí sin juzgarte. 🤲',
    default: 'Gracias por compartir eso conmigo. Cuéntame más, estoy aquí para escucharte sin juzgarte. 💚'
  };

  function addMessage(text, isUser) {
    const msg = document.createElement('div');
    msg.className = `msg ${isUser ? 'msg-user' : 'msg-bot'} msg-dynamic`;
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function resetChat() {
    chatTimeouts.forEach(t => clearTimeout(t));
    chatTimeouts = [];
    chatMessages?.querySelectorAll('.msg-dynamic').forEach(el => el.remove());
    if (emotionBtns) {
      emotionBtns.style.display = 'flex';
      emotionBtns.querySelectorAll('.emotion-btn').forEach(btn => btn.classList.remove('selected'));
    }
    if (chatInput) chatInput.value = '';
    if (chatMessages) chatMessages.scrollTop = 0;
  }

  chatResetBtn?.addEventListener('click', resetChat);

  emotionBtns?.querySelectorAll('.emotion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const emotion = btn.dataset.emotion;
      btn.classList.add('selected');
      const t1 = setTimeout(() => {
        emotionBtns.style.display = 'none';
        addMessage(`Me siento ${emotion}...`, true);
        const t2 = setTimeout(() => addMessage(botResponses[emotion] || botResponses.default, false), 800);
        chatTimeouts.push(t2);
      }, 300);
      chatTimeouts.push(t1);
    });
  });

  chatSendBtn?.addEventListener('click', sendChatMessage);
  chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
  });

  function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    addMessage(text, true);
    chatInput.value = '';
    const t = setTimeout(() => addMessage(botResponses.default, false), 800);
    chatTimeouts.push(t);
  }

  // ── BREATHING ANIMATION WITH AUDIO ─────────────
  const breathLabel = document.getElementById('breathLabel');
  const breathTimer = document.getElementById('breathTimer');
  let breathInterval = null;
  let breathRunning = false; // Starts paused so NO audio plays without activation
  let breathAudioEnabled = true;

  // Web Audio API for calming breathing sounds
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  function playBreathTone(type) {
    // ONLY play if audio enabled, running AND user is on screen 2 (Ejercicio)
    if (!breathAudioEnabled || !breathRunning || currentScreen !== 2) return;
    try {
      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'inhale') {
        // Soft ascending bowl chime for inhale (very modest volume)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
        osc.frequency.exponentialRampToValueAtTime(392.00, ctx.currentTime + 3.8); // G4
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 1.2);
        gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 3.9);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 4);
      } else if (type === 'exhale') {
        // Soft descending warm tone for exhale (very modest volume)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(392.00, ctx.currentTime); // G4
        osc.frequency.exponentialRampToValueAtTime(220.00, ctx.currentTime + 3.8); // A3
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 1.0);
        gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 3.9);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 4);
      }
    } catch(e) { /* audio not supported */ }
  }

  // Preview sound for community audio track (modest volume)
  function playCommunityAudioPreview() {
    try {
      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C chord arpeggio
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);

        const startTime = ctx.currentTime + (index * 0.35);
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(0.035, startTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.8);

        osc.start(startTime);
        osc.stop(startTime + 1.8);
      });
    } catch(e) {}
  }

  const breathPhases = [
    { label: 'Inhala', duration: 4, sound: 'inhale' },
    { label: 'Retén', duration: 4, sound: null },
    { label: 'Exhala', duration: 4, sound: 'exhale' },
    { label: 'Retén', duration: 4, sound: null }
  ];

  let breathPhase = 0;
  let breathCount = 4;

  function updateBreathingStep() {
    if (!breathRunning) return;
    breathCount--;
    if (breathCount <= 0) {
      breathPhase = (breathPhase + 1) % breathPhases.length;
      breathCount = breathPhases[breathPhase].duration;
      // Play tone ONLY when new inhale/exhale phase starts and we are on screen 2
      if (breathPhases[breathPhase].sound && currentScreen === 2) {
        playBreathTone(breathPhases[breathPhase].sound);
      }
    }
    breathLabel.textContent = breathPhases[breathPhase].label;
    breathTimer.textContent = breathCount + ' segundos';
  }

  function startBreathingTimer() {
    if (breathInterval) clearInterval(breathInterval);
    breathRunning = true;
    const playBtn = document.getElementById('breathPlayBtn');
    if (playBtn) playBtn.textContent = '⏸';
    const circle = document.getElementById('breathingCircle');
    if (circle) circle.style.animationPlayState = 'running';

    // Play initial tone
    if (breathPhases[breathPhase].sound) {
      playBreathTone(breathPhases[breathPhase].sound);
    }
    breathInterval = setInterval(updateBreathingStep, 1000);
  }

  function stopBreathingTimer() {
    breathRunning = false;
    if (breathInterval) clearInterval(breathInterval);
    const playBtn = document.getElementById('breathPlayBtn');
    if (playBtn) playBtn.textContent = '▶';
    const circle = document.getElementById('breathingCircle');
    if (circle) circle.style.animationPlayState = 'paused';
  }

  // Play button on exercise screen
  document.getElementById('breathPlayBtn')?.addEventListener('click', function() {
    if (breathRunning) {
      stopBreathingTimer();
    } else {
      startBreathingTimer();
    }
  });

  // Toggle audio on/off via the speaker button
  document.querySelector('.screen-exercise .ex-ctrl-btn:last-child')?.addEventListener('click', function() {
    breathAudioEnabled = !breathAudioEnabled;
    this.textContent = breathAudioEnabled ? '🔊' : '🔇';
  });

  // Community Audio Card click activation
  document.querySelectorAll('.comm-card').forEach((card, idx) => {
    card.addEventListener('click', function() {
      const playIcon = this.querySelector('.play-icon');
      if (playIcon && (idx === 0 || idx === 1)) {
        playCommunityAudioPreview();
        playIcon.textContent = '⏸';
        setTimeout(() => { playIcon.textContent = '▶'; }, 3000);
      }
    });
  });

  // ═══════════════════════════════════════════════
  // MODO PRESENTACIÓN (DIAPOSITIVAS)
  // ═══════════════════════════════════════════════
  const pkSlides = [
    { icon: '🤫', title: 'El silencio', text: 'Un joven rural, solo con lo que siente. Miles de jóvenes en las veredas de Antioquia cargan con emociones sin saber a quién recurrir.' },
    { icon: '🏔️', title: 'El pilar', text: 'Antioquia 2040 busca equidad. Pero la salud mental sigue siendo una barrera invisible que impide el desarrollo pleno de la juventud rural.' },
    { icon: '🚧', title: 'Las tres barreras', text: 'Distancia física a los servicios de salud. Estigma cultural que silencia. Conectividad inestable o nula en las veredas.' },
    { icon: '❤️', title: 'Por qué nos importa', text: 'Sin bienestar emocional no hay oportunidades reales. La educación, el trabajo y la cultura requieren una juventud emocionalmente estable.' },
    { icon: '❓', title: 'La pregunta', text: '¿Y si el primer paso para pedir ayuda pudiera darse sin miedo, sin juicio, desde la privacidad del celular?' },
    { icon: '🌿', title: 'Conoce a Auka', text: 'Un avatar de apoyo emocional disponible 24/7. Tu compañero para entender lo que sientes y encontrar cómo avanzar.' },
    { icon: '👂', title: 'Escucha', text: 'Auka conversa en lenguaje cercano, ayuda a nombrar emociones y responde con empatía. No es un bot genérico — entiende los modismos locales.' },
    { icon: '🔒', title: 'Privacidad', text: 'Espacio completamente privado y anónimo. Ninguna conversación queda asociada al nombre del usuario. Sin juicios.' },
    { icon: '🧘', title: 'Regulación emocional', text: 'Ejercicios de respiración, journaling y técnicas validadas por psicología. Disponibles incluso sin conexión a internet.' },
    { icon: '🔍', title: 'Detección temprana', text: 'La IA identifica señales de tristeza, ansiedad o riesgo mediante clasificadores NLP entrenados con vocabulario rural antioqueño.' },
    { icon: '🤝', title: 'Canalización', text: 'Con consentimiento explícito del joven, Auka lo conecta con un profesional humano de su municipio. Siempre con permiso.' },
    { icon: '⚠️', title: 'Lo que Auka NO hace', text: 'No diagnostica. No medica. No reemplaza terapia. La IA es puente hacia la red de salud mental, nunca sustituto del profesional.' },
    { icon: '📡', title: 'Offline-first', text: 'Funciona sin internet constante. Versión por SMS/USSD para zonas sin datos. Contenido descargable para usar en cualquier momento.' },
    { icon: '🌎', title: 'Cultura local', text: 'Entrenado con modismos rurales, indígenas y afro de Antioquia. No es una traducción — es una adaptación cultural profunda.' },
    { icon: '🧠', title: 'La tecnología', text: 'LLM con fine-tuning + clasificador de riesgo NLP + privacidad por diseño. Cada componente tiene justificación técnica y ética.' },
    { icon: '👥', title: 'El equipo', text: 'Psicología (validación emocional), Ing. Diseño de Entretenimiento Digital (experiencia interactiva), Derecho (gobernanza y privacidad) y Comunicación y Lenguajes Audiovisuales (estrategia transmedia).' },
    { icon: '🏛️', title: 'Aliados', text: 'Gobernación de Antioquia, universidades, líderes comunitarios locales y medios de comunicación como amplificadores.' },
    { icon: '⚖️', title: 'Gobernanza y ética', text: 'Supervisión humana activa. Consentimiento en cada paso. Protección de datos personales de menores. Transparencia total.' },
    { icon: '📊', title: 'Cómo sabremos que sirve', text: 'Jóvenes que lo usan por decisión propia. Reducción del tiempo entre crisis y primera atención. Métricas de impacto reales.' },
    { icon: '💚', title: 'Cierre', text: 'Que ningún joven en Antioquia tenga que sentirse solo con lo que le pasa. AUKA está contigo, siempre.' }
  ];

  // Build slides
  const pkMain = document.getElementById('pkMain');
  if (pkMain) {
    pkSlides.forEach((slide, i) => {
      const div = document.createElement('div');
      div.className = 'pk-slide' + (i === 0 ? ' active' : '');
      div.dataset.index = i;
      div.innerHTML = `
        <div class="pk-slide-number">${String(i + 1).padStart(2, '0')}</div>
        <div class="pk-icon">${slide.icon}</div>
        <h2>${slide.title}</h2>
        <p>${slide.text}</p>
      `;
      pkMain.appendChild(div);
    });
  }

  let pkCurrent = 0;
  const pkOverlay = document.getElementById('pkOverlay');
  const pkProgressBar = document.getElementById('pkProgressBar');
  const pkCounter = document.getElementById('pkCounter');

  function openPK() {
    if (!pkOverlay) return;
    pkOverlay.style.display = 'flex';
    requestAnimationFrame(() => pkOverlay.classList.add('visible'));
    document.body.style.overflow = 'hidden';
    pkCurrent = 0;
    updatePKSlide();
  }

  function closePK() {
    if (!pkOverlay) return;
    pkOverlay.classList.remove('visible');
    setTimeout(() => { pkOverlay.style.display = 'none'; }, 300);
    document.body.style.overflow = '';
  }

  function updatePKSlide() {
    document.querySelectorAll('.pk-slide').forEach((s, i) => {
      s.classList.toggle('active', i === pkCurrent);
    });
    if (pkCounter) pkCounter.textContent = `${pkCurrent + 1} / ${pkSlides.length}`;
    if (pkProgressBar) pkProgressBar.style.width = ((pkCurrent + 1) / pkSlides.length * 100) + '%';
  }

  // Event Listeners for Presentation
  document.getElementById('btnPechaKucha')?.addEventListener('click', openPK);
  document.getElementById('btnPKHero')?.addEventListener('click', openPK);
  document.getElementById('pkClose')?.addEventListener('click', closePK);

  document.getElementById('pkPrev')?.addEventListener('click', () => {
    if (pkCurrent > 0) { pkCurrent--; updatePKSlide(); }
  });
  document.getElementById('pkNext')?.addEventListener('click', () => {
    if (pkCurrent < pkSlides.length - 1) { pkCurrent++; updatePKSlide(); }
  });

  // Keyboard navigation for presentation
  document.addEventListener('keydown', (e) => {
    if (pkOverlay && pkOverlay.classList.contains('visible')) {
      if (e.key === 'Escape') closePK();
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (pkCurrent < pkSlides.length - 1) { pkCurrent++; updatePKSlide(); }
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (pkCurrent > 0) { pkCurrent--; updatePKSlide(); }
      }
    }
  });

  // ── SMOOTH SCROLL for anchor links ─────────────
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

});
