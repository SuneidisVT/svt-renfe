import { expect, test, type Page } from '@playwright/test';

const ORIGIN = 'Madrid-Atocha';
const DESTINATION = 'BARCELONA-SANTS';
const MIN_PRICE_EUR = 50;
const MAX_PRICE_EUR = 60;

function futureTravelDate(): { display: string; input: string } {
  const date = new Date();
  date.setDate(date.getDate() + 30);

  return {
    display: new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date),
    input: date.toISOString().slice(0, 10),
  };
}

function parseEuroAmount(value: string): number | null {
  const match = value.match(/(\d{1,3}(?:[.\s]\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*€/);
  if (!match) return null;

  return Number(match[1].replace(/\./g, '').replace(',', '.').replace(/\s/g, ''));
}

async function acceptCookies(page: Page): Promise<void> {
  const consent = page.getByRole('button', { name: /aceptar|accept/i }).first();
  if (await consent.isVisible().catch(() => false)) {
    await consent.click();
  }
}

async function fillStation(page: Page, label: RegExp, station: string): Promise<void> {
  const field = page.getByLabel(label).first();
  await field.fill(station);
  const suggestion = page.getByText(new RegExp(station, 'i')).last();
  if (await suggestion.isVisible().catch(() => false)) {
    await suggestion.click();
  } else {
    await field.press('Enter');
  }
}

test('buys a one-way Basic ticket from Madrid-Atocha to BARCELONA-SANTS', async ({ page }) => {
  const travelDate = futureTravelDate();

  await page.goto('/');
  await acceptCookies(page);

  await fillStation(page, /origen|origin/i, ORIGIN);
  await fillStation(page, /destino|destination/i, DESTINATION);

  const dateField = page.getByRole('textbox', { name: /^Fecha ida/i }).first();
  await dateField.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type(travelDate.display);
  await page.keyboard.press('Enter');

  const oneWayOption = page.getByText(/Viaje de ida y vuelta|round trip/i).first();
  if (await oneWayOption.isVisible().catch(() => false)) {
    await oneWayOption.click();
  }

  await page.getByRole('button', { name: /buscar|search/i }).click();
  await expect(page).toHaveURL(/result|busc|train|viaje/i, { timeout: 30_000 });

  const journeyCards = page
    .getByRole('listitem')
    .filter({ hasText: /Tren con salida|Train departing/i })
    .filter({ hasText: /€/ });
  const cardCount = await journeyCards.count();
  expect(cardCount, 'At least one available journey should be displayed').toBeGreaterThan(0);

  let matchingCard = null;
  for (let index = 0; index < cardCount; index += 1) {
    const card = journeyCards.nth(index);
    const text = await card.innerText();

    expect(text, `Journey ${index + 1} should show a journey duration`).toMatch(/\b\d{1,2}\s*(?:h(?:\s*\d{1,2}\s*min)?|horas?(?:\s+\d{1,2}\s+minutos?)?)\b|\b\d{1,2}:\d{2}\b/i);
    expect(text, `Journey ${index + 1} should show a price`).toMatch(/\d[\d.,\s]*\s*€/);

    const amount = parseEuroAmount(text);
    if (amount !== null && amount >= MIN_PRICE_EUR && amount <= MAX_PRICE_EUR) {
      matchingCard = card;
      break;
    }
  }

  expect(matchingCard, `A Basic fare between €${MIN_PRICE_EUR} and €${MAX_PRICE_EUR} must be available`).not.toBeNull();
  await matchingCard!.getByRole('link').first().click();

  const fareDialog = page.getByRole('dialog').filter({ hasText: /básic|basic/i }).first();
  await expect(fareDialog).toBeVisible();
  const basicFare = fareDialog.getByText(/básic|basic/i).first();
  if (await basicFare.isVisible().catch(() => false)) {
    await basicFare.click();
  }
  await fareDialog.getByRole('button', { name: /continuar|continue/i }).click();
});