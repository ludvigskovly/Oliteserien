# Øliteserien Dashboard

Dette er en webapp som viser Øliteserien live fra Google Sheet.

## Lokal testing

Fra denne mappen:

```sh
npm start
```

For å teste live Google Sheet-henting lokalt:

```sh
npm run start:live
```

Åpne adressen som står i terminalen.

## Publisering så alle kan åpne

Anbefalt: Vercel.

1. Lag en gratis konto på https://vercel.com
2. Legg denne mappen i et GitHub-repo, eller importer prosjektmappen med Vercel CLI.
3. Deploy prosjektet fra `outputs/oliteserien-app`.
4. Etter deploy får du en offentlig URL, for eksempel:

```text
https://oliteserien.vercel.app
```

Den lenken kan alle gutta åpne.

## Google Sheet-krav

Google Sheet-et må være lesbart for appen.

Anbefalt deling:

- `Alle med linken kan se`

Appen leser CSV fra:

```text
https://docs.google.com/spreadsheets/d/1qoqhDAtJyI_YQt_92-pTJ75eD_yRrXbRPt9JcjR0VSI/export?format=csv&gid=0
```

## Live-oppdatering

API-et cacher i omtrent 30 sekunder. Det betyr at endringer i Google Sheet normalt dukker opp på nettsiden kort tid etterpå.
