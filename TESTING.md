# Renfe ticket flow

This project contains a Page Object Model-based Playwright end-to-end test for a one-way Renfe journey. The spec delegates browser interaction to reusable Steps, PageObjects, Helpers, and Utils:

- Origin: `Madrid-Atocha`
- Destination: `BARCELONA-SANTS`
- Date: the currently selected date, so the exact date is intentionally not fixed
- Fare: `Básico` (Basic), priced between EUR 50 and EUR 120
- Completion: confirm the Basic fare and advance to the passenger-details stage without entering passenger details or purchasing

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

Renfe inventory and markup are live and can change. The test deliberately asserts that every displayed journey exposes both duration and price, then selects an available Basic fare in the requested range. It fails if no qualifying fare is available or if the booking flow cannot advance to the next stage.