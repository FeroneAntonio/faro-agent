// ============================================================
// FARO AGENT — app.js
// ============================================================

// Inserire le credenziali IBM SOLO in locale. Non condividere il file
// con le credenziali dentro.
const IBM_API_KEY = '';
const IBM_WATSONX_PROXY_URL = '';

// ── PASSO 1 & 2: DATASET + MOTORE ───────────────────────────

const CFU_ATTESI = 30;

const TUTOR = [
  { id: 'T1', nome: 'Ing. Russo',     competenza: 'Analisi I',        capacita: 4, fasciaOraria: 'mattina' },
  { id: 'T2', nome: 'Ing. Ferretti',  competenza: 'Fisica I',         capacita: 4, fasciaOraria: 'pomeriggio' },
  { id: 'T3', nome: 'Ing. Colombo',   competenza: 'Programmazione I', capacita: 4, fasciaOraria: 'sera' },
  { id: 'T4', nome: 'Dott.ssa Marini',competenza: 'Metodo di studio', capacita: 4, fasciaOraria: 'mattina' },
  { id: 'T5', nome: 'Dott. Gentile',  competenza: 'Orientamento',     capacita: 4, fasciaOraria: 'sera' },
];

// 13 studenti a rischio definiti esplicitamente
// Punteggi precalcolati per garantire le fasce corrette:
// formula: 0.40*(1-cfu/30) + 0.25*(maxTent/4) + 0.25*(min(mesi/8,1)) + 0.10*trendNorm
// trendNorm: -1→1, 0→0.5, +1→0
const STUDENTI_RISCHIO = [
  // ── CRITICI (score ≥ 0.70) ───────────────────────────────
  // N86-0388: 0.40*(27/30)+0.25*1+0.25*0.625+0.10 = 0.360+0.250+0.156+0.100 = 0.866
  {
    matricola: 'N86-0388', cfuConseguiti: 3,
    esamiFalliti: [{ esame: 'Fisica I', tentativi: 4 }],
    mesiInattivita: 5, trendVoti: -1, lavoratore: false
  },
  // N86-1042: 0.40*(26/30)+0.25*0.75+0.25*0.625+0.10 = 0.347+0.188+0.156+0.100 = 0.791
  {
    matricola: 'N86-1042', cfuConseguiti: 4,
    esamiFalliti: [{ esame: 'Analisi I', tentativi: 3 }],
    mesiInattivita: 5, trendVoti: -1, lavoratore: false
  },
  // N86-3105: 0.40*(25/30)+0.25*0.75+0.25*0.50+0.10 = 0.333+0.188+0.125+0.100 = 0.746
  {
    matricola: 'N86-3105', cfuConseguiti: 5,
    esamiFalliti: [{ esame: 'Programmazione I', tentativi: 3 }],
    mesiInattivita: 4, trendVoti: -1, lavoratore: true
  },
  // ── ALTI (score 0.50–0.69) ───────────────────────────────
  // N86-2210: 0.40*(22/30)+0.25*0.75+0.25*0.375+0.10 = 0.293+0.188+0.094+0.100 = 0.675
  // lavoratore + Analisi I (T1 mattina) → fuori perimetro #1
  {
    matricola: 'N86-2210', cfuConseguiti: 8,
    esamiFalliti: [{ esame: 'Analisi I', tentativi: 3 }],
    mesiInattivita: 3, trendVoti: -1, lavoratore: true
  },
  // N86-6671: 0.40*(22/30)+0.25*0+0.25*0.75+0.10 = 0.293+0+0.188+0.100 = 0.581
  // lavoratore + Metodo di studio (T4 mattina) → fuori perimetro #2
  {
    matricola: 'N86-6671', cfuConseguiti: 8,
    esamiFalliti: [],
    mesiInattivita: 6, trendVoti: -1, lavoratore: true
  },
  // N86-5530: 0.40*(22/30)+0.25*0.50+0.25*0.375+0.05 = 0.293+0.125+0.094+0.050 = 0.562
  {
    matricola: 'N86-5530', cfuConseguiti: 8,
    esamiFalliti: [{ esame: 'Programmazione I', tentativi: 2 }],
    mesiInattivita: 3, trendVoti: 0, lavoratore: false
  },
  // N86-4412: 0.40*(20/30)+0.25*0.50+0.25*0.375+0.05 = 0.267+0.125+0.094+0.050 = 0.536
  {
    matricola: 'N86-4412', cfuConseguiti: 10,
    esamiFalliti: [{ esame: 'Analisi I', tentativi: 2 }],
    mesiInattivita: 3, trendVoti: 0, lavoratore: false
  },
  // N86-1789: 0.40*(20/30)+0.25*0.50+0.25*0.25+0.05 = 0.267+0.125+0.063+0.050 = 0.505
  {
    matricola: 'N86-1789', cfuConseguiti: 10,
    esamiFalliti: [{ esame: 'Analisi I', tentativi: 2 }],
    mesiInattivita: 2, trendVoti: 0, lavoratore: false
  },
  // ── MEDI (score 0.35–0.49) ───────────────────────────────
  // N86-1337: 0.40*(16/30)+0.25*0.25+0.25*0.375+0.05 = 0.213+0.063+0.094+0.050 = 0.420
  {
    matricola: 'N86-1337', cfuConseguiti: 14,
    esamiFalliti: [{ esame: 'Analisi I', tentativi: 1 }],
    mesiInattivita: 3, trendVoti: 0, lavoratore: false
  },
  // N86-8819: 0.40*(16/30)+0.25*0.25+0.25*0.25+0.05 = 0.213+0.063+0.063+0.050 = 0.389
  {
    matricola: 'N86-8819', cfuConseguiti: 14,
    esamiFalliti: [{ esame: 'Fisica I', tentativi: 1 }],
    mesiInattivita: 2, trendVoti: 0, lavoratore: false
  },
  // N86-7203: 0.40*(16/30)+0.25*0.25+0.25*0.25+0.05 = 0.389
  {
    matricola: 'N86-7203', cfuConseguiti: 14,
    esamiFalliti: [{ esame: 'Fisica I', tentativi: 1 }],
    mesiInattivita: 2, trendVoti: 0, lavoratore: false
  },
  // N86-9044: 0.40*(16/30)+0.25*0.25+0.25*0.25+0.05 = 0.389 — lavoratore
  {
    matricola: 'N86-9044', cfuConseguiti: 14,
    esamiFalliti: [{ esame: 'Programmazione I', tentativi: 1 }],
    mesiInattivita: 2, trendVoti: 0, lavoratore: true
  },
  // N86-0551: 0.40*(15/30)+0.25*0+0.25*0.50+0.05 = 0.200+0+0.125+0.050 = 0.375
  {
    matricola: 'N86-0551', cfuConseguiti: 15,
    esamiFalliti: [],
    mesiInattivita: 4, trendVoti: 0, lavoratore: false
  },
];

// 47 studenti regolari generati proceduralmente
const STUDENTI_REGOLARI = Array.from({ length: 47 }, (_, i) => {
  const num = String(2000 + i).padStart(4, '0');
  return {
    matricola: `N86-${num}`,
    cfuConseguiti: 22 + (i % 9),
    esamiFalliti: [],
    mesiInattivita: i % 3 === 0 ? 1 : 0,
    trendVoti: [0, 1, 1][i % 3],
    lavoratore: false
  };
});

const STUDENTI_V1 = [...STUDENTI_RISCHIO, ...STUDENTI_REGOLARI];

// Dataset V2: stato una settimana dopo (per V2.2)
// N86-1042 ha verbalizzato Analisi I: cfuConseguiti 4→10, mesiInattivita 5→2, trend→-1
//   nuovo score: 0.40*(20/30)+0.25*0.75+0.25*0.25+0.10 = 0.617 → da Critico ad Alto
// N86-2210 non si è presentato al colloquio → mesiInattivita 3→4, urgenza aumentata
const STUDENTI_V2_PATCH = {
  'N86-1042': {
    cfuConseguiti: 10,
    esamiFalliti: [{ esame: 'Analisi I', tentativi: 3 }],
    mesiInattivita: 2,
    trendVoti: -1,
    _evento: 'ha verbalizzato Analisi I — rischio da Critico ad Alto'
  },
  'N86-2210': {
    mesiInattivita: 4,
    _evento: 'non si è presentato al colloquio — seconda convocazione, priorità alzata'
  },
};

// ── PASSO 2: MOTORE ─────────────────────────────────────────

const MAX_TENTATIVI_NORM = 4;
const MAX_INATTIVITA_NORM = 8;

function calcolaRischio(s) {
  const cfuGap  = 1 - (s.cfuConseguiti / CFU_ATTESI);
  const maxTent = s.esamiFalliti.length
    ? Math.max(...s.esamiFalliti.map(e => e.tentativi))
    : 0;
  const tentNorm  = Math.min(maxTent / MAX_TENTATIVI_NORM, 1);
  const inattNorm = Math.min(s.mesiInattivita / MAX_INATTIVITA_NORM, 1);
  const trendNorm = s.trendVoti === -1 ? 1 : s.trendVoti === 0 ? 0.5 : 0;
  return +(0.40 * cfuGap + 0.25 * tentNorm + 0.25 * inattNorm + 0.10 * trendNorm).toFixed(4);
}

function fasciaRischio(score) {
  if (score >= 0.70) return 'Critico';
  if (score >= 0.50) return 'Alto';
  if (score >= 0.35) return 'Medio';
  return 'Regolare';
}

function criticitalPrincipale(s) {
  if (s.esamiFalliti.length) {
    const worst = s.esamiFalliti.reduce((a, b) => a.tentativi >= b.tentativi ? a : b);
    return worst.esame;
  }
  if (s.mesiInattivita >= 3) return 'Metodo di studio';
  return 'Orientamento';
}

function punteggioAbbinamento(s, t, score) {
  let p = score;                                  // gravità
  p += Math.min(s.mesiInattivita / MAX_INATTIVITA_NORM, 1) * 0.2; // urgenza
  if (!s.lavoratore || t.fasciaOraria === 'sera') p += 0.1;        // compatibilità orari
  return +p.toFixed(4);
}

function eseguiDispatch(studenti, tutorInput) {
  // copia posti disponibili
  const posti = {};
  tutorInput.forEach(t => { posti[t.id] = t.capacita; });

  // calcola rischio per tutti
  const conScore = studenti.map(s => ({
    ...s,
    score: calcolaRischio(s),
    fascia: '',
    criticita: criticitalPrincipale(s),
  }));
  conScore.forEach(s => { s.fascia = fasciaRischio(s.score); });

  // separa a rischio da regolari
  const aRischio = conScore.filter(s => s.fascia !== 'Regolare')
    .sort((a, b) => b.score - a.score);
  const regolari = conScore.filter(s => s.fascia === 'Regolare');

  const abbinamenti = [];
  const fuoriPerimetro = [];

  for (const s of aRischio) {
    // filtra tutor compatibili (vincoli hard)
    const ammissibili = tutorInput.filter(t => {
      if (posti[t.id] <= 0) return false;
      if (t.competenza !== s.criticita) return false;
      if (s.lavoratore && t.fasciaOraria !== 'sera') return false;
      return true;
    });

    if (ammissibili.length === 0) {
      // fuori perimetro: determina motivo
      let motivo;
      const tutorCompetente = tutorInput.filter(t => t.competenza === s.criticita);
      const tutorSaturo     = tutorCompetente.find(t => posti[t.id] <= 0);
      const tutorOrario     = tutorCompetente.find(t => s.lavoratore && t.fasciaOraria !== 'sera');
      if (tutorCompetente.length === 0) {
        motivo = 'nessun tutor con competenza su ' + s.criticita;
      } else if (tutorSaturo && tutorCompetente.every(t => posti[t.id] <= 0)) {
        motivo = 'tutti i tutor competenti hanno raggiunto il limite di 4 studenti';
      } else if (tutorOrario) {
        motivo = 'studente lavoratore: nessun tutor serale disponibile per ' + s.criticita;
      } else if (s.mesiInattivita >= 8) {
        motivo = 'inattivo da ' + s.mesiInattivita + ' mesi — oltre la soglia del tutoraggio ordinario';
      } else {
        motivo = 'nessun tutor ammissibile con i vincoli correnti';
      }

      let indirizzamento;
      if (s.mesiInattivita >= 8) {
        indirizzamento = 'contatto diretto segreteria e counseling di ateneo';
      } else if (s.lavoratore) {
        indirizzamento = 'servizio supporto studenti lavoratori + sportello orientamento';
      } else {
        indirizzamento = 'sportello orientamento di ateneo';
      }

      fuoriPerimetro.push({ ...s, motivo, indirizzamento });
      continue;
    }

    // scegli il tutor con punteggio massimo
    const best = ammissibili.map(t => ({
      tutor: t,
      punti: punteggioAbbinamento(s, t, s.score)
    })).sort((a, b) => b.punti - a.punti)[0];

    posti[best.tutor.id]--;
    abbinamenti.push({
      studente: s,
      tutor: best.tutor,
      punteggioAbb: best.punti,
    });
  }

  return { abbinamenti, fuoriPerimetro, regolari, conScore };
}

// Calcola date colloquio (giorni da oggi in base alla fascia)
function dataColloquio(fascia) {
  const oggi = new Date();
  const offset = fascia === 'Critico' ? 2 : fascia === 'Alto' ? 5 : 8;
  const d = new Date(oggi);
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
}

function giorniAIntervento(fascia) {
  return fascia === 'Critico' ? 2 : fascia === 'Alto' ? 5 : 8;
}

// ── PASSO 4: LOG AGENTE ──────────────────────────────────────

const LOG_PASSI_BASE = [
  () => '[SENTINELLA][INFO] Lettura carriere: 60 studenti della coorte Ingegneria Informatica 2025/26 caricati.',
  () => `[SENTINELLA][INFO] Calcolo indicatori: CFU conseguiti vs attesi (30), tentativi d'esame falliti, mesi di inattività, trend voti.`,
  () => '[SENTINELLA→VALUTATORE] Task completato: 60 carriere lette — consegno gli indicatori.',
  (r) => `[VALUTATORE][INFO] Classificazione fasce di rischio: ${r.critico} Critico · ${r.alto} Alto · ${r.medio} Medio · ${r.regolari} Regolari.`,
  () => '[VALUTATORE→COORDINATORE] Artifact: 13 profili di rischio con punteggi motivati.',
  () => `[COORDINATORE][INFO] Verifica vincoli tutor: competenza per criticità principale, limite 4 studenti/tutor, fasce orarie per lavoratori.`,
  (r) => `[COORDINATORE][OK] Abbinamenti calcolati: ${r.abbinamenti} studenti assegnati a tutor.`,
  (r) => `[COORDINATORE][ATTENZIONE] Casi fuori perimetro: ${r.fuori} studenti — vincoli non soddisfatti → indirizzamento alternativo.`,
  (r) => `[COORDINATORE→VERIFICATORE] Piano proposto: ${r.abbinamenti} abbinamenti, ${r.fuori} fuori perimetro. In attesa di conferma umana.`,
  () => `[VERIFICATORE][OK] Piano pronto: proposto al coordinatore per conferma.`,
];

// ── PASSO 5 + 7 + 8: STATO GLOBALE ───────────────────────────

let risultato = null;     // output dispatch V1
let risultatoV2 = null;   // output dispatch V2
let simulazioneAttiva = false;
let analisiAvviata = false;
let analisiCompletata = false;
let pianoConfermato = false;
let analysisStage = 'idle';
let verificaTimerId = null;
let verificaTickId = null;
let verificaDeadline = null;
let verificaRemainingMs = 45000;
let verificaSospesa = false;

// ── PASSO 3 + 5 + 6 + 7 + 8 + 9: RENDER UI ─────────────────

const ROUTES = ['panoramica', 'analisi', 'piano', 'impatto'];
const LOCKED_ROUTES = ['piano', 'impatto'];

function routeFromHash() {
  const raw = window.location.hash.replace(/^#\//, '');
  return ROUTES.includes(raw) ? raw : 'panoramica';
}

function navigateTo(view) {
  if (routeFromHash() === view) {
    applyRoute();
    return;
  }
  window.location.hash = `#/${view}`;
}

function applyRoute() {
  const view = routeFromHash();
  document.querySelectorAll('.view').forEach(el => {
    el.classList.toggle('view-active', el.dataset.view === view);
  });
  document.querySelectorAll('.nav-link').forEach(link => {
    const locked = LOCKED_ROUTES.includes(link.dataset.view) && !pianoConfermato;
    link.classList.toggle('active', link.dataset.view === view);
    link.classList.toggle('locked', locked);
    link.setAttribute('aria-disabled', locked ? 'true' : 'false');
    link.title = locked ? 'Disponibile dopo la conferma del piano' : '';
  });
  aggiornaBlocchiPostConferma();
}

function aggiornaBlocchiPostConferma() {
  const pianoLock = document.getElementById('piano-lock');
  const pianoContent = document.getElementById('piano-content');
  const impattoLock = document.getElementById('impatto-lock');
  const impattoContent = document.getElementById('impatto-content');
  if (!pianoLock || !pianoContent || !impattoLock || !impattoContent) return;

  pianoLock.classList.toggle('hidden', pianoConfermato);
  pianoContent.classList.toggle('hidden', !pianoConfermato);
  impattoLock.classList.toggle('hidden', pianoConfermato);
  impattoContent.classList.toggle('hidden', !pianoConfermato);
}

function setAnalysisStage(stage) {
  analysisStage = stage;
  const labels = {
    idle: 'Da avviare',
    running: 'Scansione in corso',
    proposte: 'Proposte pronte',
    confermato: 'Piano confermato',
    monitoraggio: 'Monitoraggio aggiornato',
  };
  const values = { idle: 0, running: 1, proposte: 2, confermato: 3, monitoraggio: 4 };
  const activeValue = values[stage] || 0;
  const state = document.getElementById('analysis-state');
  if (state) state.textContent = labels[stage] || labels.idle;

  document.querySelectorAll('#analysis-stepper li').forEach((li, idx) => {
    const step = idx + 1;
    li.classList.toggle('done', activeValue > step);
    li.classList.toggle('active', activeValue === step);
  });
}

function setStartButtonsState() {
  const buttons = document.querySelectorAll('[data-start-analysis]');
  buttons.forEach(btn => {
    btn.disabled = analisiAvviata;
    if (analysisStage === 'running') {
      btn.textContent = 'Analisi in corso';
    } else if (analisiCompletata) {
      btn.textContent = 'Analisi completata';
    } else {
      btn.textContent = 'Esegui analisi della coorte';
    }
  });
}

function conteggiDaRisultato(res) {
  return {
    critico:    res.abbinamenti.filter(a => a.studente.fascia === 'Critico').length
                + res.fuoriPerimetro.filter(s => s.fascia === 'Critico').length,
    alto:       res.abbinamenti.filter(a => a.studente.fascia === 'Alto').length
                + res.fuoriPerimetro.filter(s => s.fascia === 'Alto').length,
    medio:      res.abbinamenti.filter(a => a.studente.fascia === 'Medio').length
                + res.fuoriPerimetro.filter(s => s.fascia === 'Medio').length,
    regolari:   res.regolari.length,
    abbinamenti: res.abbinamenti.length,
    fuori:      res.fuoriPerimetro.length,
  };
}

function metricheDaRisultato(res) {
  const totArischio = res.abbinamenti.length + res.fuoriPerimetro.length;
  const critico  = res.abbinamenti.filter(a => a.studente.fascia === 'Critico').length
    + res.fuoriPerimetro.filter(s => s.fascia === 'Critico').length;
  const alto     = res.abbinamenti.filter(a => a.studente.fascia === 'Alto').length
    + res.fuoriPerimetro.filter(s => s.fascia === 'Alto').length;
  const medio    = res.abbinamenti.filter(a => a.studente.fascia === 'Medio').length
    + res.fuoriPerimetro.filter(s => s.fascia === 'Medio').length;
  const coperturaPct = Math.round((res.abbinamenti.length / totArischio) * 100);
  const creditiGap = res.abbinamenti.reduce((acc, a) => acc + (CFU_ATTESI - a.studente.cfuConseguiti), 0)
    + res.fuoriPerimetro.reduce((acc, s) => acc + (CFU_ATTESI - s.cfuConseguiti), 0);
  const giorniList = res.abbinamenti.map(a => giorniAIntervento(a.studente.fascia));
  const giorniMediani = giorniList.length
    ? giorniList.sort((a, b) => a - b)[Math.floor(giorniList.length / 2)]
    : 0;

  return {
    totArischio,
    critico,
    alto,
    medio,
    coperturaPct,
    creditiGap,
    giorniMediani,
    lavoratoriSupportati: res.abbinamenti.filter(a => a.studente.lavoratore).length,
    abbandoniEvitabili: critico + alto,
    tutorUsati: new Set(res.abbinamenti.map(a => a.tutor.id)).size,
  };
}

function appendLogLine(container, line) {
  const riga = document.createElement('div');
  riga.className = 'log-riga';

  let rest = line;
  let parsed = false;
  while (rest.startsWith('[')) {
    const end = rest.indexOf(']');
    if (end < 0) break;
    const tag = rest.slice(1, end);
    const span = document.createElement('span');
    if (['INFO', 'OK', 'ATTENZIONE'].includes(tag)) {
      span.className = `log-marker log-${tag.toLowerCase()}`;
    } else {
      const tagClass = tag.toLowerCase()
        .replace('sentinella', 'tag-sentinella')
        .replace('valutatore', 'tag-valutatore')
        .replace('coordinatore', 'tag-coordinatore')
        .replace('verificatore', 'tag-verificatore');
      span.className = `log-agent-tag ${tagClass.includes('tag-') ? tagClass : 'tag-handoff'}`;
      if (tag.includes('→')) span.classList.add('tag-handoff');
    }
    span.textContent = `[${tag}]`;
    riga.appendChild(span);
    rest = rest.slice(end + 1);
    parsed = true;
  }

  riga.append(document.createTextNode(parsed ? rest.trimStart() : line));
  container.appendChild(riga);
  riga.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function avviaLog(logPassi, onComplete) {
  const container = document.getElementById('log-container');
  container.innerHTML = '';
  let i = 0;
  function nextStep() {
    if (i >= logPassi.length) {
      onComplete();
      return;
    }
    appendLogLine(container, logPassi[i]);
    i++;
    setTimeout(nextStep, 420);
  }
  nextStep();
}

function eventoAggiornamentoV2(matricola) {
  if (matricola === 'N86-1042') return 'Verbalizzato Analisi I: rischio Critico → Alto, 0.790→0.617';
  if (matricola === 'N86-2210') return 'Convocazione senza risposta: fascia aggiornata a Critico';
  return null;
}

function cardScope(options) {
  return options.isV2 ? 'v2' : 'v1';
}

function maxTentativiStudente(s) {
  return s.esamiFalliti.length ? Math.max(...s.esamiFalliti.map(e => e.tentativi)) : 0;
}

function materiaCriticaStudente(s) {
  return s.esamiFalliti.length
    ? s.esamiFalliti.reduce((a, b) => a.tentativi >= b.tentativi ? a : b).esame
    : s.criticita;
}

function percorsoSupportoProposto(s, t) {
  const complementari = [];
  const materia = materiaCriticaStudente(s);
  if (maxTentativiStudente(s) >= 3) {
    complementari.push(`Ricevimento del docente di ${materia}`);
  }
  if (s.lavoratore) {
    complementari.push('Gruppo di studio serale tra pari');
    complementari.push('Materiali asincroni della materia');
  } else {
    complementari.push('Gruppo di studio tra pari della coorte');
  }
  if (s.mesiInattivita >= 4) {
    complementari.push('Percorso SInAPSi — counseling (adesione volontaria)');
  }

  return {
    primario: `${t.competenza} (${t.nome})`,
    complementari: complementari.slice(0, 3),
  };
}

function renderPercorsoSupporto(s, t) {
  const percorso = percorsoSupportoProposto(s, t);
  return `
    <div class="support-path">
      <h4>Percorso di supporto proposto</h4>
      <p><strong>Primario:</strong> ${percorso.primario}</p>
      <p><strong>Complementari:</strong> ${percorso.complementari.join(' · ')}</p>
      <p class="nota-muted">Proposte, non obblighi: lo studente sceglie come farsi accompagnare.</p>
    </div>
  `;
}

function riskRank(fascia) {
  return { Regolare: 0, Medio: 1, Alto: 2, Critico: 3 }[fascia] || 0;
}

function calcolaEsitiVerifica(resV1, resV2) {
  if (!resV1 || !resV2) return { migliorati: [], escalation: [], inCorso: [], byMatricola: {} };
  const v2ByMatricola = new Map(resV2.conScore.map(s => [s.matricola, s]));
  const esiti = { migliorati: [], escalation: [], inCorso: [], byMatricola: {} };
  resV1.conScore.filter(s => s.fascia !== 'Regolare').forEach(s1 => {
    const s2 = v2ByMatricola.get(s1.matricola);
    if (!s2) return;
    const convocazioneSenzaRisposta = s1.matricola === 'N86-2210';
    let tipo = 'inCorso';
    if (riskRank(s2.fascia) < riskRank(s1.fascia)) tipo = 'migliorati';
    if (riskRank(s2.fascia) > riskRank(s1.fascia) || convocazioneSenzaRisposta) tipo = 'escalation';
    const esito = { matricola: s1.matricola, prima: s1, dopo: s2, tipo };
    esiti[tipo].push(esito);
    esiti.byMatricola[s1.matricola] = tipo;
  });
  return esiti;
}

function labelEsito(tipo) {
  if (tipo === 'migliorati') return 'Migliorato';
  if (tipo === 'escalation') return 'Escalation';
  return 'In corso';
}

function renderProposte(res, isV2) {
  const sec = document.getElementById(isV2 ? 'sezione-proposte-v2' : 'sezione-proposte');
  renderProposteIn(sec, res, {
    isV2,
    includeConfirm: !isV2,
    includePiano: !isV2,
  });
}

function renderProposteIn(sec, res, options) {
  sec.innerHTML = '';

  const titolo = document.createElement('h2');
  titolo.textContent = options.isV2 ? 'Piano aggiornato — settimana successiva' : 'Piano interventi proposto';
  sec.appendChild(titolo);

  const subtitolo = document.createElement('p');
  subtitolo.className = 'subtitle';
  subtitolo.textContent = `${res.abbinamenti.length} studenti con supporto assegnato · ${res.fuoriPerimetro.length} fuori perimetro · ${res.regolari.length} regolari`;
  sec.appendChild(subtitolo);

  // --- card per ogni abbinamento ---
  res.abbinamenti.forEach(({ studente: s, tutor: t, punteggioAbb }) => {
    const card = document.createElement('div');
    card.className = `card card-${s.fascia.toLowerCase()}`;
    card.dataset.matricola = s.matricola;

    const tentDesc = s.esamiFalliti.length
      ? s.esamiFalliti.map(e => `${e.tentativi} ${e.tentativi === 1 ? 'tentativo fallito' : 'tentativi falliti'} su ${e.esame}`).join(', ')
      : 'nessun esame fallito';
    const inattDesc = s.mesiInattivita > 0
      ? `inattivo da ${s.mesiInattivita} ${s.mesiInattivita === 1 ? 'mese' : 'mesi'}`
      : 'attività recente';
    const scadenza = dataColloquio(s.fascia);

    const eventoV2 = options.isV2 ? eventoAggiornamentoV2(s.matricola) : null;
    const scope = cardScope(options);
    const esiti = options.isV2 ? calcolaEsitiVerifica(risultato, risultatoV2) : null;
    const esitoTipo = esiti ? esiti.byMatricola[s.matricola] : null;
    const footerButtons = [
      options.includePiano
        ? `<button class="btn-secondary" type="button" onclick="togglePianoRientro('${s.matricola}')">Apri piano di rientro</button>`
        : '',
      `<button id="btn-ai-${scope}-${s.matricola}" class="btn-secondary" type="button" onclick="generaMessaggioAI('${s.matricola}', '${scope}')">Genera bozza personalizzata</button>`,
    ].filter(Boolean).join('');
    const footer = `
      <div class="card-footer">${footerButtons}</div>
      ${options.includePiano ? `<div id="piano-${s.matricola}" class="piano-rientro hidden"></div>` : ''}
      <div id="ai-panel-${scope}-${s.matricola}" class="ai-panel hidden"></div>
    `;

    card.innerHTML = `
      <div class="card-header">
        <span class="matricola">${s.matricola}</span>
        <span class="badge badge-${s.fascia.toLowerCase()}">Rischio: ${s.fascia}</span>
        ${s.lavoratore ? '<span class="badge badge-orario">orario compatibile</span>' : ''}
        ${eventoV2 ? `<span class="badge badge-evento">${eventoV2}</span>` : ''}
        ${esitoTipo ? `<span class="badge badge-esito-${esitoTipo}">${labelEsito(esitoTipo)}</span>` : ''}
      </div>
      <div class="card-body">
        <p><strong>Tutor assegnato:</strong> ${t.competenza} (${t.nome}) · fascia ${t.fasciaOraria}</p>
        ${renderPercorsoSupporto(s, t)}
        <p><strong>Perché:</strong> ${s.cfuConseguiti}/${CFU_ATTESI} CFU · ${tentDesc} · ${inattDesc}</p>
        <p><strong>Prima azione:</strong> colloquio entro <em>${scadenza}</em></p>
      </div>
      ${footer}
    `;
    sec.appendChild(card);
  });

  // --- fuori perimetro ---
  if (res.fuoriPerimetro.length > 0) {
    const fpSec = document.createElement('div');
    fpSec.className = 'sezione-fuori';
    fpSec.innerHTML = '<h3>Fuori perimetro tutoraggio</h3>';
    res.fuoriPerimetro.forEach(s => {
      const row = document.createElement('div');
      row.className = 'fuori-row';
      const eventoV2 = options.isV2 ? eventoAggiornamentoV2(s.matricola) : null;
      row.innerHTML = `
        <span class="matricola">${s.matricola}</span>
        <span class="badge badge-${s.fascia.toLowerCase()}">Rischio: ${s.fascia}</span>
        <span class="badge badge-orario">Percorso proposto: SInAPSi / segreteria — contatto diretto</span>
        <span><strong>Motivo:</strong> ${s.motivo}</span>
        <span class="row-note"><strong>Indirizzamento:</strong> ${s.indirizzamento}</span>
        ${eventoV2 ? `<span class="row-note"><strong>Aggiornamento:</strong> ${eventoV2}</span>` : ''}
      `;
      fpSec.appendChild(row);
    });
    sec.appendChild(fpSec);
  }

  // --- contatore regolari ---
  const regDiv = document.createElement('div');
  regDiv.className = 'regolari-counter';
  regDiv.innerHTML = `<span class="badge badge-regolare">${res.regolari.length} studenti regolari: nessuna azione necessaria</span>`;
  sec.appendChild(regDiv);

  // --- bottone conferma (solo V1) ---
  if (options.includeConfirm) {
    const btnConferma = document.createElement('button');
    btnConferma.id = 'btn-conferma';
    btnConferma.className = 'btn-primary btn-grande';
    btnConferma.type = 'button';
    btnConferma.textContent = 'Conferma piano di intervento';
    btnConferma.onclick = confermaPiano;
    sec.appendChild(btnConferma);
  }

  sec.classList.remove('hidden');
}

// ── PASSO 6: V2.1 PIANO DI RIENTRO ───────────────────────────

const RISORSE_ATENEO = {
  'Analisi I':        ['Esercitazioni supplementari Analisi I', 'Tutoraggio individuale calcolo', 'Materiali KIRO — Matematica per Ingegneria'],
  'Fisica I':         ['Laboratorio di Fisica — sessioni aperte', 'Sportello Fisica I (lunedì/mercoledì)', 'Video-lezioni repository ateneo'],
  'Programmazione I': ['Peer tutoring Informatica', 'Laboratorio di programmazione libero', 'Piattaforma esercizi online ateneo'],
  'Metodo di studio': ['Workshop "Organizzare lo studio universitario"', 'Colloquio con orientatore', 'Diario di studio guidato (download)'],
  'Orientamento':     ['Sportello orientamento (su appuntamento)', 'Colloquio con tutor di ateneo', 'Percorso "Ri-orienta il tuo percorso"'],
};

function togglePianoRientro(matricola) {
  const panel = document.getElementById(`piano-${matricola}`);
  if (!panel) return;
  if (!panel.classList.contains('hidden')) {
    panel.classList.add('hidden');
    return;
  }

  const abb = risultato.abbinamenti.find(a => a.studente.matricola === matricola)
    || (risultatoV2 && risultatoV2.abbinamenti.find(a => a.studente.matricola === matricola));
  if (!abb) return;

  const { studente: s, tutor: t } = abb;
  const cfuMancanti = CFU_ATTESI - s.cfuConseguiti;
  const obiettivoCfu = Math.min(cfuMancanti, 12);
  const primoEsame = s.esamiFalliti.length ? s.esamiFalliti[0].esame : t.competenza;
  const risorse = RISORSE_ATENEO[s.criticita] || RISORSE_ATENEO['Orientamento'];
  const appuntamento = dataColloquio(s.fascia);
  const risorseEstese = [
    ...risorse,
    'Ricevimento del docente della materia',
    'Gruppo di studio tra pari della coorte',
  ];
  const linkIstituzionali = [
    '<a href="https://www.sinapsi.unina.it" target="_blank" rel="noopener">SInAPSi — counseling e supporto</a>',
    '<a href="https://www.unina.it" target="_blank" rel="noopener">Portale di ateneo</a>',
  ];

  panel.innerHTML = `
    <div class="piano-contenuto">
      <h4>Piano di rientro — ${s.matricola}</h4>
      <p><strong>Obiettivo CFU prossima sessione:</strong> conseguire almeno ${obiettivoCfu} CFU (da ${s.cfuConseguiti} a ${s.cfuConseguiti + obiettivoCfu} su 30)</p>
      <p><strong>Primo esame da sbloccare:</strong> ${primoEsame}</p>
      <p><strong>Appuntamento tutor:</strong> ${t.nome} — ${appuntamento} (fascia ${t.fasciaOraria})</p>
      <p><strong>Risorse di ateneo suggerite:</strong></p>
      <ul>
        ${risorseEstese.map(r => `<li>${r}</li>`).join('')}
        ${linkIstituzionali.map(r => `<li>${r}</li>`).join('')}
      </ul>
      <div class="mini-timeline">
        <span>Rilevazione: oggi</span>
        <span>Colloquio: ${appuntamento}</span>
        <span>Verifica: ciclo successivo</span>
        <span>Obiettivo sessione: ${obiettivoCfu} CFU</span>
      </div>
    </div>
  `;
  panel.classList.remove('hidden');
}

// ── PASSO 7: POST-CONFERMA ───────────────────────────────────

function confermaPiano() {
  const btn = document.getElementById('btn-conferma');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Piano confermato';
  }

  pianoConfermato = true;
  setAnalysisStage('confermato');
  renderPostConferma(risultato);
  aggiornaBlocchiPostConferma();
  applyRoute();
  avviaTimerVerificatore();
  navigateTo('piano');
}

function renderPostConferma(res) {
  renderCalendario(res);
  renderEmail(res);
  renderReport(res);
  renderDashboard(res);
}

function ensureVerificatorePill() {
  let pill = document.getElementById('verificatore-pill');
  if (pill) return pill;
  pill = document.createElement('div');
  pill.id = 'verificatore-pill';
  pill.className = 'verificatore-pill hidden';
  document.body.appendChild(pill);
  return pill;
}

function formatCountdown(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `0:${String(seconds).padStart(2, '0')}`;
}

function renderVerificatorePill() {
  const pill = ensureVerificatorePill();
  if (simulazioneAttiva) {
    pill.classList.add('hidden');
    return;
  }
  pill.classList.remove('hidden');
  if (verificaSospesa) {
    pill.innerHTML = `
      <span><strong>VERIFICATORE</strong> — ciclo sospeso</span>
      <button type="button" class="pill-button" onclick="riprendiTimerVerificatore()">Riprendi</button>
      <button type="button" class="pill-button" onclick="eseguiCicloVerificatore()">Esegui subito</button>
    `;
    return;
  }

  const remaining = verificaDeadline ? verificaDeadline - Date.now() : verificaRemainingMs;
  pill.innerHTML = `
    <span><strong>VERIFICATORE</strong> — prossimo ciclo tra ${formatCountdown(remaining)} · nel sistema reale: lunedì 06:00</span>
    <button type="button" class="pill-button" onclick="eseguiCicloVerificatore()">Esegui subito</button>
    <button type="button" class="pill-button" onclick="sospendiTimerVerificatore()">Sospendi</button>
  `;
}

function clearTimerVerificatore() {
  if (verificaTimerId) clearTimeout(verificaTimerId);
  if (verificaTickId) clearInterval(verificaTickId);
  verificaTimerId = null;
  verificaTickId = null;
}

function avviaTimerVerificatore() {
  if (simulazioneAttiva || verificaTimerId || verificaSospesa) return;
  clearTimerVerificatore();
  verificaRemainingMs = 45000;
  verificaDeadline = Date.now() + verificaRemainingMs;
  renderVerificatorePill();
  verificaTickId = setInterval(renderVerificatorePill, 1000);
  verificaTimerId = setTimeout(eseguiCicloVerificatore, verificaRemainingMs);
}

function sospendiTimerVerificatore() {
  if (simulazioneAttiva || verificaSospesa) return;
  verificaRemainingMs = Math.max(0, verificaDeadline - Date.now());
  verificaSospesa = true;
  clearTimerVerificatore();
  renderVerificatorePill();
}

function riprendiTimerVerificatore() {
  if (simulazioneAttiva || !verificaSospesa) return;
  verificaSospesa = false;
  verificaDeadline = Date.now() + verificaRemainingMs;
  renderVerificatorePill();
  verificaTickId = setInterval(renderVerificatorePill, 1000);
  verificaTimerId = setTimeout(eseguiCicloVerificatore, verificaRemainingMs);
}

function eseguiCicloVerificatore() {
  clearTimerVerificatore();
  ensureVerificatorePill().classList.add('hidden');
  if (simulazioneAttiva) return;
  navigateTo('analisi');
  simulaSettimana();
}

function renderCalendario(res) {
  const cal = document.getElementById('calendario-colloqui');
  cal.innerHTML = '<h3>Calendario colloqui — ordine di priorità</h3>';
  const ordinati = [...res.abbinamenti].sort((a, b) => b.studente.score - a.studente.score);
  const table = document.createElement('table');
  table.className = 'tabella';
  table.innerHTML = `<thead><tr><th>Matricola</th><th>Fascia</th><th>Tutor</th><th>Data colloquio</th><th>Priorità</th></tr></thead>`;
  const tbody = document.createElement('tbody');
  ordinati.forEach(({ studente: s, tutor: t }, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${s.matricola}</td><td><span class="badge badge-${s.fascia.toLowerCase()}">${s.fascia}</span></td><td>${t.nome}</td><td>${dataColloquio(s.fascia)}</td><td>#${idx + 1}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  cal.appendChild(table);
}

function bozzaEmail(s, t) {
  const oggetto = 'Invito a un incontro di supporto al percorso universitario';
  const corpo = [
    'Gentile studentessa/studente,',
    `il tuo percorso ci sta a cuore. Ti proponiamo un breve colloquio di tutorato con ${t.nome} (${t.competenza}) il ${dataColloquio(s.fascia)}, in fascia ${t.fasciaOraria}, per concordare insieme un primo passo utile.`,
    'L’incontro non ha finalità valutative: serve a concordare insieme un primo passo concreto per rendere più fluido il percorso universitario.',
    'Per confermare o richiedere uno spostamento, rispondi a questa comunicazione secondo le modalità previste dal corso di studi.',
    'Cordialmente,',
    'Coordinatore della coorte — Ingegneria Informatica 2025/26',
  ].join('\n\n');
  return { oggetto, corpo };
}

function mailtoDaBozza(bozza) {
  return `mailto:?subject=${encodeURIComponent(bozza.oggetto)}&body=${encodeURIComponent(bozza.corpo)}`;
}

function trovaAbbinamentoPerBozza(matricola, scope) {
  const sorgente = scope === 'v2' && risultatoV2 ? risultatoV2 : risultato;
  return sorgente ? sorgente.abbinamenti.find(a => a.studente.matricola === matricola) : null;
}

function costruisciPromptTutorAI(s, t) {
  const scadenza = dataColloquio(s.fascia);
  return [
    'Scrivi in italiano una email di convocazione per un colloquio di tutorato. Tono di supporto e accoglienza, mai colpevolizzante. Massimo 120 parole. Rivolgiti allo studente con la matricola. Includi data proposta e invita a rispondere per concordare alternative. Nessun oggetto, solo il corpo.',
    '',
    `Matricola: ${s.matricola}`,
    `Fascia di rischio: ${s.fascia}`,
    `Criticità principale: ${s.criticita}`,
    `CFU conseguiti: ${s.cfuConseguiti} su ${CFU_ATTESI}`,
    `Mesi di inattività: ${s.mesiInattivita}`,
    `Tutor assegnato: ${t.nome} (${t.competenza}), fascia oraria ${t.fasciaOraria}`,
    `Prima azione: colloquio di tutorato entro ${scadenza}`,
    `Scadenza proposta: ${scadenza}`,
  ].join('\n');
}

function templateLocaleMessaggio(s, t) {
  return bozzaEmail(s, t).corpo;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderBozzaAI(panel, testo, badgeText, badgeClass, oggetto = 'Bozza di tutorato') {
  const mailto = `mailto:?subject=${encodeURIComponent(oggetto)}&body=${encodeURIComponent(testo)}`;
  panel.innerHTML = `
    <div class="ai-draft-header">
      <span class="badge ${badgeClass} ai-badge">${badgeText}</span>
      <div class="draft-actions">
        <button class="btn-secondary" type="button" onclick="approvaBozzaAI(this)">Approva bozza</button>
        <a class="btn-secondary" href="${mailto}">Apri nel client di posta</a>
      </div>
    </div>
    <textarea class="ai-textarea" rows="7">${escapeHtml(testo)}</textarea>
  `;
  panel.classList.remove('hidden');
}

function approvaBozzaAI(button) {
  const panel = button.closest('.ai-panel');
  if (!panel) return;
  const badge = panel.querySelector('.ai-badge');
  if (!badge) return;
  badge.textContent = 'Approvata dal tutor';
  badge.className = 'badge badge-approvata ai-badge';
}

async function richiediBozzaIBM(prompt) {
  if (!IBM_API_KEY.trim() || !IBM_WATSONX_PROXY_URL.trim()) throw new Error('missing local IBM config');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(IBM_WATSONX_PROXY_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-ibm-api-key': IBM_API_KEY,
      },
      body: JSON.stringify({
        prompt,
        max_tokens: 300,
      }),
      signal: controller.signal,
    });
    const data = await response.json();
    const text =
      (data && data.results && data.results[0] && data.results[0].generated_text) ||
      (data && data.generated_text) ||
      (data && data.output_text);
    if (!text) throw new Error('missing generated text');
    return text.trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function generaMessaggioAI(matricola, scope) {
  const abb = trovaAbbinamentoPerBozza(matricola, scope);
  if (!abb) return;
  const { studente: s, tutor: t } = abb;
  const button = document.getElementById(`btn-ai-${scope}-${matricola}`);
  const panel = document.getElementById(`ai-panel-${scope}-${matricola}`);
  if (!button || !panel) return;

  const defaultText = button.textContent;
  button.disabled = true;
  button.textContent = 'Generazione in corso…';

  try {
    const prompt = costruisciPromptTutorAI(s, t);
    const generated = await richiediBozzaIBM(prompt);
    renderBozzaAI(panel, generated, 'Bozza generativa — richiede approvazione del tutor', 'badge-ai');
  } catch (error) {
    renderBozzaAI(panel, templateLocaleMessaggio(s, t), 'Generata da template locale — richiede approvazione del tutor', 'badge-offline');
  } finally {
    button.disabled = false;
    button.textContent = defaultText;
  }
}

function renderEmail(res) {
  const emailSec = document.getElementById('bozze-email');
  emailSec.innerHTML = '<h3>Bozze email di convocazione</h3>';
  const prime3 = [...res.abbinamenti]
    .sort((a, b) => b.studente.score - a.studente.score)
    .slice(0, 3);
  prime3.forEach(({ studente: s, tutor: t }) => {
    const bozza = bozzaEmail(s, t);
    const div = document.createElement('div');
    div.className = 'email-box';
    div.innerHTML = `
      <p><strong>Destinatario:</strong> da completare nel client ufficiale di posta</p>
      <p><strong>Oggetto:</strong> ${bozza.oggetto}</p>
      <p>${bozza.corpo.replace(/\n\n/g, '</p><p>')}</p>
      <div class="email-actions">
        <a class="btn-secondary" href="${mailtoDaBozza(bozza)}">Apri nel client di posta</a>
      </div>
    `;
    emailSec.appendChild(div);
  });
  const nota = document.createElement('p');
  nota.className = 'nota-muted';
  nota.textContent = `${res.abbinamenti.length - 3} bozze aggiuntive disponibili nel report completo.`;
  if (res.abbinamenti.length > 3) emailSec.appendChild(nota);
}

function renderReport(res) {
  const rep = document.getElementById('report-sintetico');
  const metriche = metricheDaRisultato(res);
  rep.innerHTML = `
    <h3>Report sintetico per il coordinatore</h3>
    <p>Coorte <strong>Ingegneria Informatica 2025/26</strong> — scansione del ${new Date().toLocaleDateString('it-IT')}</p>
    <ul>
      <li>Studenti analizzati: 60</li>
      <li>Studenti a rischio identificati: ${metriche.totArischio}</li>
      <li>Supporto assegnato: ${res.abbinamenti.length} studenti</li>
      <li>Fuori perimetro: ${res.fuoriPerimetro.length} studenti (indirizzati a servizi alternativi)</li>
      <li>Studenti regolari: ${res.regolari.length}</li>
      <li>Tutor impiegati: ${metriche.tutorUsati} su 5</li>
      <li>Crediti-gap totale: ${metriche.creditiGap}</li>
    </ul>
  `;
}

function renderDashboard(res) {
  const dash = document.getElementById('dashboard');
  const metriche = metricheDaRisultato(res);

  dash.innerHTML = `
    <h3>Dashboard</h3>
    <div class="dashboard-grid">
      <div class="dash-card">
        <div class="dash-val">60</div>
        <div class="dash-label">Studenti analizzati</div>
      </div>
      <div class="dash-card dash-critico">
        <div class="dash-val">${metriche.critico}</div>
        <div class="dash-label">Rischio Critico</div>
      </div>
      <div class="dash-card dash-alto">
        <div class="dash-val">${metriche.alto}</div>
        <div class="dash-label">Rischio Alto</div>
      </div>
      <div class="dash-card dash-medio">
        <div class="dash-val">${metriche.medio}</div>
        <div class="dash-label">Rischio Medio</div>
      </div>
      <div class="dash-card">
        <div class="dash-val">${metriche.coperturaPct}%</div>
        <div class="dash-label">Copertura tutor</div>
        <div class="dash-formula">assegnati / totale a rischio × 100</div>
      </div>
      <div class="dash-card">
        <div class="dash-val">${metriche.creditiGap}</div>
        <div class="dash-label">Crediti-gap totale</div>
        <div class="dash-formula">Σ (30 − CFU conseguiti) per studenti a rischio</div>
      </div>
      <div class="dash-card">
        <div class="dash-val">${metriche.giorniMediani} gg</div>
        <div class="dash-label">Giorni mediani all'intervento</div>
        <div class="dash-formula">mediana dei giorni tra oggi e il colloquio proposto</div>
      </div>
    </div>

    <div class="strip-faro">
      <h4>Senza Faro / Con Faro</h4>
      <p>Oggi lo studente in difficoltà viene intercettato in media dopo mesi, spesso a fine anno quando è troppo tardi.
      <strong>Con Faro: 7 giorni.</strong> (stima dichiarata sul processo attuale)</p>
    </div>

    <div class="ai-explain">
      <h4>Dove sta l'intelligenza</h4>
      <ol>
        <li>Architettura agentica — quattro subagent specializzati (percezione, valutazione, dispatch, verifica) coordinati in un ciclo autonomo con conferma umana.</li>
        <li>Dispatch a vincoli — abbinamento tutor con competenze, capienza e fascia oraria compatibile.</li>
        <li>Linguaggio e sintesi — bozze generate su richiesta da AI generativa, sempre con approvazione umana; fallback a template locale offline. In produzione: orchestrata in watsonx.ai.</li>
      </ol>
    </div>

    <div class="sdg-mappa">
      <h4>Target ONU 2030 serviti</h4>
      <div class="sdg-grid">
        <div class="sdg-item">
          <span class="sdg-badge">4.3</span>
          <span>Istruzione equa e di qualità — <strong>${metriche.totArischio} studenti intercettati</strong></span>
        </div>
        <div class="sdg-item">
          <span class="sdg-badge">8.6</span>
          <span>Riduzione abbandono — <strong>${metriche.abbandoniEvitabili} abbandoni evitabili</strong> (fascia Critico + Alto, stima dichiarata)</span>
        </div>
        <div class="sdg-item">
          <span class="sdg-badge">10.2</span>
          <span>Inclusione — <strong>${metriche.lavoratoriSupportati} studenti lavoratori supportati</strong></span>
        </div>
      </div>
    </div>

    <div class="azioni-post">
      <button id="btn-simula" class="btn-primary btn-grande" type="button" onclick="simulaSettimana()">Simula settimana successiva</button>
    </div>
  `;
  renderEsitiImpatto();
  renderAzioniVerificatore();
}

function obiettivoCfuStudente(s) {
  return Math.min(CFU_ATTESI - s.cfuConseguiti, 12);
}

function cfuRecuperabiliStimati(res) {
  return res.abbinamenti.reduce((tot, a) => tot + obiettivoCfuStudente(a.studente), 0);
}

function renderEsitiImpatto() {
  const placeholder = document.getElementById('esiti-placeholder');
  const panel = document.getElementById('esiti-ciclo');
  if (!placeholder || !panel) return;

  if (!risultatoV2) {
    placeholder.classList.remove('hidden');
    panel.classList.add('hidden');
    return;
  }

  const esiti = calcolaEsitiVerifica(risultato, risultatoV2);
  placeholder.classList.add('hidden');
  panel.classList.remove('hidden');
  panel.innerHTML = `
    <h3>Esiti del ciclo di verifica</h3>
    <div class="outcome-grid">
      <div class="outcome-card outcome-good"><strong>${esiti.migliorati.length}</strong><span>Migliorati</span></div>
      <div class="outcome-card outcome-risk"><strong>${esiti.escalation.length}</strong><span>Escalation</span></div>
      <div class="outcome-card"><strong>${esiti.inCorso.length}</strong><span>In corso</span></div>
    </div>
    <p><strong>CFU recuperabili se i piani sono seguiti:</strong> ${cfuRecuperabiliStimati(risultato)} (stima dichiarata; ipotesi: ogni studente assegnato completa l'obiettivo CFU del proprio piano di rientro).</p>
    <p><strong>Baseline nazionale di permanenza:</strong> 86,7% (ANVUR 2026) — obiettivo: misurare lo scostamento della coorte a 6 mesi.</p>
  `;
}

function esameVerbalizzato(esito) {
  return materiaCriticaStudente(esito.prima);
}

function trovaTutorPerMatricola(matricola, res = risultato) {
  return res && res.abbinamenti.find(a => a.studente.matricola === matricola);
}

function messaggioRiconoscimento(esito) {
  const abb = trovaTutorPerMatricola(esito.matricola);
  const tutor = abb ? abb.tutor.nome : 'il tutor assegnato';
  const esame = esameVerbalizzato(esito);
  return `Gentile studentessa/studente ${esito.matricola}, complimenti: hai verbalizzato ${esame} e il tuo percorso è tornato a crescere.\n\nL'università è al tuo fianco anche adesso: ${tutor} resta disponibile se vuoi consolidare il metodo, e trovi sempre i gruppi di studio della coorte, i ricevimenti dei docenti e i servizi di ateneo.\n\nSe c'è altro che possiamo fare, rispondi a questa email: ci siamo.`;
}

function messaggioEscalation(esito) {
  const abb = trovaTutorPerMatricola(esito.matricola) || (risultatoV2 && risultatoV2.abbinamenti.find(a => a.studente.matricola === esito.matricola));
  const tutor = abb ? abb.tutor.nome : 'il tutor di riferimento';
  const data = dataColloquio('Critico');
  return `Gentile studentessa/studente ${esito.matricola}, la convocazione precedente può essere sfuggita: non è un problema, ripartiamo da qui.\n\nTi proponiamo due alternative concrete: un nuovo colloquio con ${tutor} entro ${data}, oppure un contatto diretto con SInAPSi/segreteria per individuare il supporto più adatto.\n\nRispondi a questa email indicando l'opzione più sostenibile per te: decidiamo insieme.`;
}

function renderAzioniVerificatore() {
  const panels = [
    document.getElementById('azioni-verificatore'),
    document.getElementById('azioni-verificatore-analisi'),
  ].filter(Boolean);
  if (!panels.length) return;
  if (!risultatoV2) {
    panels.forEach(panel => {
      panel.classList.add('hidden');
      panel.innerHTML = '';
    });
    return;
  }

  const esiti = calcolaEsitiVerifica(risultato, risultatoV2);
  const drafts = [
    ...esiti.migliorati.map(esito => ({
      title: `Messaggio di riconoscimento — ${esito.matricola}`,
      text: messaggioRiconoscimento(esito),
      subject: 'Messaggio di riconoscimento dal tutorato',
    })),
    ...esiti.escalation.map(esito => ({
      title: `Sollecito gentile — ${esito.matricola}`,
      text: messaggioEscalation(esito),
      subject: 'Nuova proposta di colloquio di tutorato',
    })),
  ];

  panels.forEach(panel => {
    panel.classList.remove('hidden');
    panel.innerHTML = '<h3>Azioni del Verificatore</h3>';
    drafts.forEach(draft => {
      const box = document.createElement('div');
      box.className = 'verifier-draft';
      const title = document.createElement('h4');
      title.textContent = draft.title;
      box.appendChild(title);
      const draftPanel = document.createElement('div');
      draftPanel.className = 'ai-panel';
      box.appendChild(draftPanel);
      panel.appendChild(box);
      renderBozzaAI(draftPanel, draft.text, 'Bozza del Verificatore — richiede approvazione del tutor', 'badge-ai', draft.subject);
    });
  });
}

// ── PASSO 8: V2.2 SIMULA SETTIMANA ───────────────────────────

function simulaSettimana() {
  if (simulazioneAttiva) {
    navigateTo('analisi');
    return;
  }
  simulazioneAttiva = true;
  clearTimerVerificatore();
  ensureVerificatorePill().classList.add('hidden');
  const btn = document.getElementById('btn-simula');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Simulazione in corso';
  }
  setAnalysisStage('monitoraggio');
  navigateTo('analisi');

  // costruisce il dataset V2 applicando le patch
  const studentiV2 = STUDENTI_V1.map(s => {
    const patch = STUDENTI_V2_PATCH[s.matricola];
    if (!patch) return { ...s };
    const { _evento, ...campi } = patch;
    return { ...s, ...campi };
  });

  // log V2
  const logV2 = [
    '[VERIFICATORE][INFO] Avvio ricontrollo settimanale — carico stato aggiornato della coorte.',
    '[SENTINELLA][INFO] Leggo 60 carriere aggiornate al ' + new Date().toLocaleDateString('it-IT') + '.',
    '[SENTINELLA→VALUTATORE] Task completato: carriere aggiornate lette — consegno gli indicatori.',
    '[VERIFICATORE][INFO] Verifico esiti colloqui della settimana: 1 presentato, 1 convocazione senza risposta.',
    '[VALUTATORE][OK] N86-1042 ha verbalizzato Analisi I: CFU aggiornati a 10 — punteggio 0.790→0.617 — fascia: Critico → Alto.',
    '[VALUTATORE][ATTENZIONE] N86-2210: convocazione senza risposta — inattività +1 mese (ora 4 mesi) — fascia aggiornata: Critico.',
    '[VALUTATORE→COORDINATORE] Artifact: profili aggiornati con un miglioramento e una escalation.',
    '[COORDINATORE][INFO] Rieseguo abbinamenti tutor con posti disponibili invariati.',
    '[COORDINATORE→VERIFICATORE] Piano aggiornato: N86-1042 scesa ad Alto; N86-2210 visibile in fascia Critico.',
    '[VERIFICATORE][OK] Esito positivo per N86-1042 — preparo il messaggio di riconoscimento (in attesa di approvazione).',
    '[VERIFICATORE][ATTENZIONE] Escalation per N86-2210 — preparo un sollecito gentile con alternative (in attesa di approvazione).',
  ];

  const sezioneV2 = document.getElementById('sezione-v2');
  sezioneV2.innerHTML = '<h2>Aggiornamento settimanale</h2>';
  const logContV2 = document.createElement('div');
  logContV2.id = 'log-v2-container';
  logContV2.className = 'log-container';
  sezioneV2.appendChild(logContV2);
  sezioneV2.classList.remove('hidden');
  sezioneV2.scrollIntoView({ behavior: 'smooth' });

  let i = 0;
  function nextV2() {
    if (i >= logV2.length) {
      // esegui dispatch V2
      const tutorV2 = TUTOR.map(t => ({ ...t }));
      risultatoV2 = eseguiDispatch(studentiV2, tutorV2);
      const propSec = document.getElementById('sezione-proposte-v2');
      renderProposteIn(propSec, risultatoV2, {
        isV2: true,
        includeConfirm: false,
        includePiano: false,
      });
      propSec.classList.remove('hidden');
      renderDashboard(risultatoV2);
      renderEsitiImpatto();
      renderAzioniVerificatore();
      propSec.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    appendLogLine(logContV2, logV2[i]);
    i++;
    setTimeout(nextV2, 400);
  }
  nextV2();
}

// ── V2.5: SCARICA REPORT ─────────────────────────────────────

function scaricaReport() {
  const res = risultato;
  if (!res) return;
  const metriche = metricheDaRisultato(res);
  const oggi = new Date().toLocaleDateString('it-IT');
  let txt = `FARO AGENT — Report coorte Ingegneria Informatica 2025/26\n`;
  txt += `Generato il: ${oggi}\n\n`;
  txt += `=== PIANO INTERVENTI ===\n\n`;

  [...res.abbinamenti]
    .sort((a, b) => b.studente.score - a.studente.score)
    .forEach(({ studente: s, tutor: t }) => {
      txt += `${s.matricola} → ${t.nome} (${t.competenza})\n`;
      txt += `  Fascia: ${s.fascia} | Punteggio: ${s.score}\n`;
      txt += `  CFU: ${s.cfuConseguiti}/30 | Inattività: ${s.mesiInattivita} mesi\n`;
      txt += `  Colloquio: ${dataColloquio(s.fascia)}\n\n`;
    });

  txt += `=== FUORI PERIMETRO ===\n\n`;
  res.fuoriPerimetro.forEach(s => {
    txt += `${s.matricola} — ${s.motivo}\n`;
    txt += `  Indirizzamento: ${s.indirizzamento}\n\n`;
  });

  txt += `=== STUDENTI REGOLARI ===\n${res.regolari.length} studenti: nessuna azione necessaria.\n\n`;
  txt += `=== METRICHE ===\n`;
  txt += `Crediti-gap totale: ${metriche.creditiGap}\n`;
  txt += `Formula rischio: 0.40*(1-CFU/30) + 0.25*tentFalliti/4 + 0.25*mesiInatt/8 + 0.10*trendVoti\n`;

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `faro-report-${oggi.replace(/\//g, '-')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── PASSO 9: TRACCIA AGENTE ───────────────────────────────────

function renderTracciaAgente(res) {
  const ta = document.getElementById('traccia-agente-body');
  ta.innerHTML = `
    <h4>Formula del rischio</h4>
    <pre>Rischio = 0,40 × (1 − CFU/30)
        + 0,25 × (max_tentativi_falliti / 4)
        + 0,25 × (mesi_inattività / 8)
        + 0,10 × (trendVoti normalizzato: -1→1, 0→0.5, +1→0)

Fasce: Critico ≥ 0,70 · Alto ≥ 0,50 · Medio ≥ 0,35 · Regolare &lt; 0,35</pre>

    <h4>Vincoli hard</h4>
    <ul>
      <li>Competenza tutor = criticità principale dello studente</li>
      <li>Max 4 studenti per tutor</li>
      <li>Studenti lavoratori → solo tutor con fascia serale</li>
    </ul>

    <h4>Vincoli soft (punteggio abbinamento)</h4>
    <ul>
      <li>Base: punteggio di rischio dello studente</li>
      <li>+0,2 × urgenza (mesi inattività / 8)</li>
      <li>+0,1 se compatibilità orari soddisfatta</li>
    </ul>

    <h4>Regole percorso di supporto</h4>
    <ul>
      <li>Primario: tutor assegnato dal dispatch</li>
      <li>Tentativi massimi ≥ 3: ricevimento del docente della materia critica</li>
      <li>Studente lavoratore: gruppo serale tra pari e materiali asincroni</li>
      <li>Altri studenti: gruppo di studio tra pari della coorte</li>
      <li>Inattività ≥ 4 mesi: percorso SInAPSi — counseling su adesione volontaria</li>
      <li>Massimo 3 proposte complementari, sempre non obbligatorie</li>
    </ul>

    <h4>Occupazione tutor</h4>
    <table class="tabella">
      <thead><tr><th>Tutor</th><th>Competenza</th><th>Fascia oraria</th><th>Posti occupati / max</th><th>Stato</th></tr></thead>
      <tbody>
        ${(function() {
          const conteggioTutor = {};
          res.abbinamenti.forEach(a => { conteggioTutor[a.tutor.id] = (conteggioTutor[a.tutor.id]||0)+1; });
          return TUTOR.map(t => {
            const n = conteggioTutor[t.id]||0;
            const saturo = n >= t.capacita;
            return '<tr' + (saturo?' class="fp-row"':'') + '><td>'+t.nome+'</td><td>'+t.competenza+'</td><td>'+t.fasciaOraria+'</td><td>'+n+' / '+t.capacita+'</td><td>'+(saturo?'SATURATO':'disponibile')+'</td></tr>';
          }).join('');
        })()}
      </tbody>
    </table>

    <h4>Punteggi abbinamento</h4>
    <table class="tabella">
      <thead><tr><th>Matricola</th><th>Fascia</th><th>Criticità</th><th>Rischio</th><th>Tutor</th><th>Punteggio abb.</th></tr></thead>
      <tbody>
        ${res.abbinamenti.map(({ studente: s, tutor: t, punteggioAbb }) =>
          `<tr><td>${s.matricola}</td><td>${s.fascia}</td><td>${s.criticita}</td><td>${s.score}</td><td>${t.nome}</td><td>${punteggioAbb}</td></tr>`
        ).join('')}
        ${res.fuoriPerimetro.map(s =>
          `<tr class="fp-row"><td>${s.matricola}</td><td>${s.fascia}</td><td>${s.criticita}</td><td>${s.score}</td><td colspan="2">fuori perimetro — ${s.motivo}</td></tr>`
        ).join('')}
      </tbody>
    </table>
  `;
}

// ── ENTRY POINT ───────────────────────────────────────────────

function analizzaCoorte() {
  if (analysisStage === 'running') {
    navigateTo('analisi');
    return;
  }

  analisiAvviata = true;
  setAnalysisStage('running');
  setStartButtonsState();
  navigateTo('analisi');

  document.getElementById('analysis-empty').classList.add('hidden');
  document.getElementById('sezione-log').classList.remove('hidden');
  document.getElementById('sezione-proposte').classList.add('hidden');
  document.getElementById('sezione-v2').classList.add('hidden');
  document.getElementById('sezione-proposte-v2').classList.add('hidden');
  document.getElementById('sezione-traccia').classList.add('hidden');
  document.getElementById('sezione-log').scrollIntoView({ behavior: 'smooth' });

  // Esegui dispatch per ottenere i numeri per i log
  const tutorCopy = TUTOR.map(t => ({ ...t }));
  risultato = eseguiDispatch(STUDENTI_V1, tutorCopy);

  const counts = conteggiDaRisultato(risultato);
  const passi = LOG_PASSI_BASE.map(fn => fn(counts));

  avviaLog(passi, () => {
    analisiCompletata = true;
    setAnalysisStage('proposte');
    setStartButtonsState();
    renderProposte(risultato, false);
    renderTracciaAgente(risultato);
    document.getElementById('sezione-traccia').classList.remove('hidden');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setAnalysisStage('idle');
  setStartButtonsState();

  document.querySelectorAll('[data-start-analysis]').forEach(btn => {
    btn.addEventListener('click', analizzaCoorte);
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', event => {
      const locked = LOCKED_ROUTES.includes(link.dataset.view) && !pianoConfermato;
      if (locked) event.preventDefault();
    });
  });

  const downloadBtn = document.getElementById('btn-scarica');
  if (downloadBtn) downloadBtn.addEventListener('click', scaricaReport);

  window.addEventListener('hashchange', applyRoute);
  if (!window.location.hash) window.location.hash = '#/panoramica';
  applyRoute();
});
