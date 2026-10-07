import { test } from '@playwright/test';
import { RenfeTicketSteps } from './Steps/renfe-ticket.steps';

test.describe('Renfe one-way ticket booking', () => {
  test('Selects a Basic one-way ticket from Madrid-Atocha to BARCELONA-SANTS', async ({ page }) => {
    const ticketSteps = new RenfeTicketSteps(page);

    await ticketSteps.searchOneWayJourney();
    await ticketSteps.verifyJourneyResults();
    await ticketSteps.selectAvailableBasicFare(50, 120);
    await ticketSteps.confirmBasicFare();
    await ticketSteps.advanceToPassengerDetails();
  });
});
