# spec.md — Faro Agent (MVP challenge, 2h)

## Contesto
Challenge Codemotion / IBM. Agente AI contro la dispersione universitaria,
allineato ai target 4.3, 8.6 e 10.2 dell'Agenda ONU 2030. In Italia il 13%
degli studenti delle statali abbandona tra primo e secondo anno (ANVUR 2026).
Deliverable: video 60s o screenshot del prototipo.

## Requisiti
- Tutor/coordinatore NON informatico: dalla coorte al piano interventi
  in 2 click, zero gergo tecnico
- Studente a rischio: intercettato presto, abbinato al supporto giusto
- Giuria: indicatori trasparenti, vincoli e metriche verificabili,
  privacy by design

## Specifiche
Web app single-page: index.html + style.css + app.js, JavaScript vanilla,
zero backend, zero dipendenze esterne, dati simulati dentro app.js.
SOLO matricole anonime (es. "N86-1042"), mai nomi o dati personali
degli studenti; i tutor hanno nomi di fantasia.

### Flusso (2 click, dall'alto verso il basso)
1. BANNER: "Registro carriere collegato: Coorte Ingegneria Informatica
   2025/26 · 60 studenti · scansione automatica: ogni lunedì 06:00" +
   bottone grande [Analizza coorte]
2. LOG AGENTE: righe che appaiono progressivamente (~400ms l'una):
   lettura carriere → calcolo indicatori (CFU vs attesi, tentativi
   falliti, mesi di inattività) → fasce di rischio → vincoli tutor →
   abbinamenti → casi fuori perimetro → piano pronto
3. PROPOSTE, una card per studente a rischio, linguaggio semplice:
   "N86-1042 → Tutor Analisi I (Ing. Russo) · Rischio: Critico ·
   Perché: 6/30 CFU, 3 tentativi falliti su Analisi I, inattivo da
   3 mesi · Prima azione: colloquio entro venerdì".
   Sotto: sezione "Fuori perimetro tutoraggio" con motivo e
   indirizzamento (es. "inattivo da 8 mesi → contatto diretto
   segreteria e counseling di ateneo").
   In fondo, contatore CALCOLATO dai dati: "N studenti regolari:
   nessuna azione necessaria" (con questo dataset N = 47).
   Bottone grande [Conferma piano]
4. DOPO CONFERMA: calendario colloqui ordinato per priorità + bozze
   email di convocazione (tono di supporto, mai punitivo) + report
   sintetico per il coordinatore + DASHBOARD: studenti analizzati,
   a rischio per fascia, copertura tutor %, crediti-gap totale,
   giorni mediani all'intervento (= giorni tra oggi e la data del
   colloquio proposto). Formule visibili in didascalia.
5. "TRACCIA AGENTE" (sezione collassabile in fondo): formula del
   rischio con pesi dichiarati, vincoli hard/soft, punteggio di ogni
   abbinamento. Il gergo tecnico vive solo qui.

### Motore (constraint-based dispatch)
- Rischio = 0,40·(1 − CFU/attesi) + 0,25·tentativiFalliti(norm.) +
  0,25·mesiInattività(norm.) + 0,10·trendVoti(norm.)
- Fasce: Critico ≥ 0,70 · Alto ≥ 0,50 · Medio ≥ 0,35 · Regolare sotto
- Vincoli hard: competenza del tutor adeguata alla criticità
  principale dello studente; max 4 studenti per tutor; fascia oraria
  (vincolo attivo SOLO per studenti lavoratori → tutor serale; tutti
  gli altri studenti sono compatibili con ogni fascia)
- Criticità principale = l'esame con più tentativi falliti; se nessun
  esame fallito: "Metodo di studio" se domina l'inattività, altrimenti
  "Orientamento"
- Vincoli soft (punteggio abbinamento): gravità del rischio + urgenza
  (inattività recente) + compatibilità orari
- Assegnazione greedy in ordine di gravità; se nessun tutor
  ammissibile → fuori perimetro con motivo e indirizzamento

### Dataset (progettato, non casuale)
60 studenti simulati, 5 tutor (Analisi I, Fisica I, Programmazione I,
Metodo di studio, Orientamento) con capacità max 4 e fasce orarie
(mattina/pomeriggio/sera).
Campi studente: matricola, cfuConseguiti (attesi = 30), esami falliti
con numero tentativi, mesiInattivita, trendVoti (−1/0/+1), lavoratore
(bool). Campi tutor: nome di fantasia, competenza, capacita (4),
fasciaOraria.
Il dataset DEVE garantire:
- fasce Critico/Alto/Medio tutte popolate: 13 studenti a rischio in
  totale, di cui 2 finiranno fuori perimetro
- 1 tutor che satura i 4 posti: lo studente successivo devia sulla
  seconda scelta con spiegazione visibile
- 2 casi fuori perimetro con motivo credibile
- 4-5 studenti con flag "lavoratore" (vedi V2.4)
- 47 studenti regolari (= 60 − 13, il conteggio deve emergere dai
  dati: l'agente non inventa allarmi)

## Vincoli UX
- 2 click: [Analizza coorte] → [Conferma piano]
- Linguaggio di supporto, mai punitivo; zero gergo tecnico nella UI
  principale; gergo solo dentro "Traccia agente"
- Bottoni grandi, una colonna, leggibile in un video a 60 secondi

## Out of scope
Login, database reale, dati personali reali, invio email reale,
backend, valutazioni psicologiche, responsive mobile.

## Criteri di accettazione
- Gira aprendo index.html in locale, nessuna dipendenza
- Log agente: almeno 6 passi, resa progressiva
- Ogni abbinamento: fascia + perché + prima azione + scadenza
- Fuori perimetro con motivo e indirizzamento
- Studenti regolari dichiarati esplicitamente
- Metriche calcolate dai dati, formula e pesi visibili
- Vincoli mai violati (competenza, tetto 4, orari)
- Solo matricole anonime in tutta la UI

## FUNZIONALITÀ V2 (in ordine di build; tagliare dal fondo se in ritardo)

### V2.1 — Piano di rientro personalizzato [OBBLIGATORIA]
Click su una card studente → pannello "Piano di rientro" generato dai
dati: obiettivo CFU per la prossima sessione, primo esame da sbloccare,
appuntamento col tutor (data/fascia), risorse di ateneo suggerite.
Template testuale + interpolazione dei dati, nessuna logica nuova.

### V2.2 — [Simula settimana successiva] [OBBLIGATORIA]
Bottone visibile dopo la conferma del piano. Carica un secondo stato
precalcolato del dataset e mostra un log di ricontrollo:
"verifico esiti → N86-1042 ha verbalizzato Analisi I: rischio da
Critico ad Alto → N86-2210 non si è presentato al colloquio: seconda
convocazione, priorità alzata → 1 posto tutor liberato: riassegnato
a N86-3105". Usa matricole realmente presenti nel dataset.
L'agente verifica, si corregge e itera.

### V2.3 — Strip "Senza Faro / Con Faro" in dashboard
Tre stringhe di testo: "Oggi lo studente in difficoltà viene
intercettato in media dopo mesi, spesso a fine anno. Con Faro:
7 giorni. (stima dichiarata sul processo attuale)".

### V2.4 — Vincolo studenti lavoratori
Flag booleano "lavoratore" su 4-5 studenti: vincolo hard → solo tutor
con fascia serale; badge "orario compatibile" sulla card. Il flag NON
aumenta il rischio: cambia solo il tipo di supporto.

### V2.5 — [Scarica report]
Bottone che genera un file .txt del piano via Blob download.

### V2.6 — Footer governance + mappa SDG [solo stringhe, sempre]
Footer: "Privacy by design · Matricole pseudonimizzate ·
Human-in-the-loop · Criteri dichiarati". In dashboard, sotto le
metriche, il target servito, usando SOLO metriche già calcolate:
studenti intercettati → 4.3 · abbandoni evitabili (= intercettati in
fascia Critico e Alto, stima dichiarata) → 8.6 · studenti lavoratori
supportati → 10.2.
