# PLAN.md — Faro Agent (unica passata)

## Obiettivo
Costruire il prototipo completo in 3 file (index.html, style.css, app.js) rispettando spec.md e AGENTS.md senza dipendenze esterne.

---

## Piano di build (10 passi)

1. **Dataset simulato** → `app.js`
   60 studenti (matricole anonime) + 5 tutor con i casi forzati della spec: 13 a rischio (fasce Critico/Alto/Medio tutte popolate), 4-5 lavoratori, 2 fuori perimetro precalcolati, 47 regolari; include `datasetV2` precalcolato per V2.2.

2. **Motore a vincoli** → `app.js`
   Funzione `calcolaRischio()` con la formula esatta (pesi 0.40/0.25/0.25/0.10), classificazione nelle 4 fasce, determinazione della criticità principale (esame con più tentativi falliti → inattività → orientamento); vincoli hard (competenza, tetto 4 posti, fascia serale solo per lavoratori); assegnazione greedy per gravità; output: array abbinamenti + array fuoriPerimetro.

3. **Scheletro HTML + layout colonna** → `index.html` + `style.css`
   Struttura semantica delle 5 sezioni (banner, log, proposte, post-conferma, traccia agente); variabili CSS per colori (indaco primario, rosso/arancione/giallo/verde per le fasce); font di sistema; bottoni grandi a piena larghezza; testo leggibile a video.

4. **Killer feature — Log agente progressivo** → `app.js` + `style.css`
   Funzione `avviaLog()` che emette le righe ogni ~400ms: lettura carriere → calcolo indicatori → fasce di rischio → vincoli tutor → abbinamenti → casi fuori perimetro → piano pronto (≥ 6 passi); al termine mostra la sezione PROPOSTE.

5. **Killer feature — Card proposte** → `app.js` + `style.css`
   Render di una card per ogni studente a rischio: matricola, tutor assegnato, fascia colorata, perché (CFU, tentativi, inattività), prima azione con scadenza; badge "orario compatibile" per i lavoratori (V2.4); sezione "Fuori perimetro" con motivo e indirizzamento; contatore studenti regolari calcolato dai dati; bottone [Conferma piano].

6. **V2.1 — Piano di rientro** → `app.js` + `style.css`
   Click su card → pannello inline: obiettivo CFU prossima sessione, primo esame da sbloccare, data/fascia appuntamento tutor, risorse di ateneo suggerite; template testuale con interpolazione dati, zero logica nuova.

7. **Post-conferma: calendario + email + dashboard** → `app.js` + `style.css`
   Click [Conferma piano] → mostra: calendario colloqui ordinato per priorità; bozze email tono di supporto (mai punitivo); report sintetico coordinatore; dashboard con studenti analizzati, a rischio per fascia, copertura tutor %, crediti-gap totale, giorni mediani all'intervento; formule visibili in didascalia; strip "Senza Faro / Con Faro" (V2.3); mappa SDG con metriche calcolate (V2.6); bottone [Simula settimana successiva] (V2.2); bottone [Scarica report] (V2.5).

8. **V2.2 — Simula settimana successiva** → `app.js`
   Click sul bottone → carica `datasetV2` precalcolato, avvia un secondo log di ricontrollo (stesso meccanismo del passo 4) con eventi reali: studente che verbalizza esame (rischio scende), studente che non si presenta (priorità alzata), posto tutor liberato e riassegnato; matricole realmente presenti nel dataset.

9. **Traccia agente (collassabile)** → `app.js` + `style.css` + `index.html`
   Sezione `<details>` in fondo: formula del rischio con pesi dichiarati, lista vincoli hard/soft, tabella punteggi abbinamento per ogni studente; gergo tecnico confinato qui, invisibile nel flusso principale.

10. **Validazione criteri di accettazione** → nessun file nuovo
    Verifica checklist completa: apertura senza errori console, log ≥ 6 passi con resa progressiva, ogni abbinamento ha fascia + perché + prima azione + scadenza, fuori perimetro con motivo e indirizzamento, 47 regolari dichiarati, metriche calcolate dai dati con formule visibili, vincoli mai violati, solo matricole anonime in tutta la UI, V2.1 e V2.2 funzionanti, footer privacy (V2.6).

---

Nessuna ambiguità: pronto per la modalità Agent.
