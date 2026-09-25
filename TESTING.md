# Renfe ticket flow

This project contains a Playwright end-to-end test for a one-way Renfe journey:

- Origin: `Madrid-Atocha`
- Destination: `BARCELONA-SANTS`
- Date: 30 days from the test run, so the exact date is intentionally not fixed
- Fare: `Basic`, priced between EUR 50 and EUR 60

## Run

Install Chromium once:

```powershell
npm run install:browsers
```

Run headless:

```powershell
npm test
```

Run with the browser visible:

```powershell
npm run test:headed
```

Renfe inventory and markup are live and can change. The test deliberately asserts that every displayed journey exposes both duration and price, then fails when no qualifying Basic fare is available.