# Wanhua Community Research Dashboard

Interactive Traditional Chinese dashboard for the 31 Wanhua Community Development Association records published in the project database.

## Features

- summary metrics with explicit coverage and completeness definitions;
- relative coordinate plot using government-published latitude and longitude;
- establishment-decade distribution;
- search, village, data-quality, and sorting controls;
- association-level detail view with source provenance;
- downloadable privacy-minimized JSON data;
- responsive and keyboard-accessible interaction.

## Data refresh

Run the repository-level builder before developing or publishing the dashboard:

```bash
node ../research/scripts/build-wanhua-database.mjs
```

The builder validates the official source snapshot, regenerates the research reports and processed database, then synchronizes the dashboard’s bundled and downloadable JSON copies.

## Local development

```bash
npm install
npm run dev
```

Use `npm test` to run the deployment build and rendered-output checks.

## Attribution

Source: Taipei City Government Department of Social Welfare, 2026, “臺北市社區發展服務_社區發展協會.” Government data is used under the Open Government Data License, Version 1.0.
