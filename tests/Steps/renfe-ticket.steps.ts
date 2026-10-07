import { expect, type Page } from '@playwright/test';
import { acceptCookieConsentIfVisible } from '../Helpers/cookie-consent.helper';
import { selectOptions } from '../Helpers/select-options.helper';
import { RenfeTicketPage } from '../PageObjects/renfe-ticket.page';
import { isFareWithinRange, parseEuroAmount } from '../Utils/fare.utils';

export class RenfeTicketSteps {
  private readonly ticketPage: RenfeTicketPage;

  constructor(page: Page) {
    this.ticketPage = new RenfeTicketPage(page);
  }

  async searchOneWayJourney(): Promise<void> {
    await this.ticketPage.open();
    await acceptCookieConsentIfVisible(this.ticketPage.page);

    await selectOptions(
      this.ticketPage.originField,
      this.ticketPage.page.getByRole('option', {
        name: /MADRID-PUERTA DE ATOCHA-ALMUDENA GRANDES/i,
      }),
      'Madrid',
    );
    await selectOptions(
      this.ticketPage.destinationField,
      this.ticketPage.page.getByRole('option', { name: /BARCELONA-SANTS/i }),
      'BARCELONA-SANTS',
    );

    await this.ticketPage.outboundDateField.click();
    await this.ticketPage.page.getByText('Viaje solo ida', { exact: true }).click();
    await this.ticketPage.outboundDateField.press('Enter');
    await this.ticketPage.searchButton.click();
  }

  async verifyJourneyResults(): Promise<void> {
    await this.ticketPage.waitForJourneys();
    await acceptCookieConsentIfVisible(this.ticketPage.page);

    const journeyCount = await this.ticketPage.journeys.count();
    expect(journeyCount, 'At least one available journey should be displayed').toBeGreaterThan(0);

    for (let index = 0; index < journeyCount; index += 1) {
      const journeyText = await this.ticketPage.journeys.nth(index).innerText();
      expect(journeyText, `Journey ${index + 1} should show a duration`).toMatch(
        /\b\d+\s*horas?(?:\s+\d+\s*minutos?)?\b/i,
      );
      expect(journeyText, `Journey ${index + 1} should show a price`).toMatch(
        /\d+(?:[.,]\d{1,2})?\s*€/,
      );
    }
  }

  async selectAvailableBasicFare(minimum: number, maximum: number): Promise<void> {
    const journeyCount = await this.ticketPage.journeys.count();
    let selectedFare = false;

    for (let index = 0; index < journeyCount && !selectedFare; index += 1) {
      const journey = this.ticketPage.journeys.nth(index);
      await this.ticketPage.openFareDetails(journey);
      await this.ticketPage.dismissBlockingNoticeIfVisible();

      const basicFare = journey.getByRole('button', { name: /Básico/i }).first();
      if ((await basicFare.count()) === 0) {
        continue;
      }

      const farePrice = basicFare.getByText(/^\d+(?:[.,]\d{1,2})\s*€$/).first();
      const amount = parseEuroAmount(await farePrice.innerText());
      if (isFareWithinRange(amount, minimum, maximum)) {
        await basicFare.click();
        selectedFare = true;
      }
    }

    expect(
      selectedFare,
      `An available Basic fare between €${minimum} and €${maximum} should be found`,
    ).toBe(true);
  }

  async confirmBasicFare(): Promise<void> {
    await acceptCookieConsentIfVisible(this.ticketPage.page);
    await this.ticketPage.dismissBlockingNoticeIfVisible();
    await this.ticketPage.selectJourneyButton.click();
    await expect(this.ticketPage.basicFareConfirmation).toContainText(/Básico/i);
    await acceptCookieConsentIfVisible(this.ticketPage.page);
    await this.ticketPage.basicFareConfirmation
      .getByText('No, quiero continuar con Básico', { exact: true })
      .click();
    await this.ticketPage.dismissBlockingNoticeIfVisible(5_000);
  }

  async advanceToPassengerDetails(): Promise<void> {
    await this.ticketPage.waitForPassengerDetailsStage();
    await expect(this.ticketPage.passengerDetailsTitle).toBeVisible();
  }
}
