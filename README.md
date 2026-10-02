# Faro Agent

Prototipo di supporto agli studenti universitari: analisi di una coorte simulata, indicatori trasparenti, proposte di tutoraggio e piani di rientro con verifica umana.

## Avvio

Aprire `index.html` nel browser. HTML, CSS e JavaScript vanilla, senza installazione di dipendenze o backend.

## Stato attuale

- Dati simulati di 60 studenti e 5 tutor di fantasia.
- Analisi a regole e abbinamenti con vincoli.
- Proposte motivate, piano di rientro, dashboard e simulazione della settimana successiva.
- Bozze AI opzionali tramite un proxy IBM configurabile; configurazione vuota nella versione condivisa e fallback locale.
- Nessun login reale, database, registro universitario collegato o invio email effettivo.

La demo illustra il comportamento previsto. Indicatori e metriche del prototipo non costituiscono risultati validati su studenti reali.

## Documenti

- [Specifiche originali della demo](spec.md)
- [Piano originale della demo](PLAN.md)
- [Piano e scadenze del gruppo](docs/PIANO-GRUPPO.md)
- [Ricerche](ricerche/README.md)
- [Come collaborare](CONTRIBUTING.md)

`spec.md` e `AGENTS.md` descrivono il prototipo originale e vanno preservati. Le proposte del nuovo progetto si documentano separatamente.

## Collegamento con comesisupera.it

Repository collegato: https://github.com/FeroneAntonio/comesisupera

L'integrazione tra individuazione delle difficoltà e risorse didattiche è da progettare con il gruppo; non è ancora implementata.

## Credenziali

Non inserire credenziali reali nel JavaScript condiviso. Le eventuali chiavi di un servizio AI devono essere gestite dal backend/proxy della futura applicazione.
