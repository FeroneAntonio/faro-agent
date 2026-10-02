# AGENTS.md — Faro Agent

- spec.md è l'unica fonte di verità; nessuna funzionalità fuori
  specifica; non modificare mai spec.md e AGENTS.md
- Stack: HTML/CSS/JS vanilla in 3 file (index.html, style.css,
  app.js), zero dipendenze, zero over-engineering
- Priorità: demo funzionante > UI presentabile > eleganza del codice
- Killer feature: log decisionale progressivo + card proposte —
  massima cura lì
- Stile UI: pulito e istituzionale; sfondo chiaro, un colore primario
  (indaco), fasce di rischio con colori funzionali (Critico rosso,
  Alto arancione, Medio giallo, Regolare verde), font di sistema,
  testo grande e leggibile in un video
- index.html deve aprirsi in locale senza alcun errore in console
- Al termine verifica TUTTI i criteri di accettazione di spec.md e
  correggi prima di dichiarare concluso
- Testi UI in italiano; tono verso lo studente sempre di supporto,
  mai colpevolizzazione
- Budget molto limitato: unica passata completa, nessuna conferma
  intermedia; se un dettaglio minore è ambiguo scegli l'opzione più
  semplice e annotala in fondo; chiedi solo se davvero bloccante
- Risposte sintetiche: elenco di ciò che hai fatto e criteri
  verificati, niente spiegazioni riga per riga del codice
- Niente test automatici, niente refactor: è un prototipo demo
