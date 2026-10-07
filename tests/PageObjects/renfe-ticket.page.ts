import type { Locator, Page } from '@playwright/test';

export class RenfeTicketPage {
  readonly page: Page;
  readonly originField: Locator;
  readonly destinationField: Locator;
  readonly outboundDateField: Locator;
  readonly searchButton: Locator;
  readonly journeyList: Locator;
  readonly journeys: Locator;
  readonly selectJourneyButton: Locator;
  readonly basicFareConfirmation: Locator;
  readonly passengerDetailsStage: Locator;
  readonly passengerDetailsTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.originField = page.getByRole('combobox', { name: 'Origen' });
    this.destinationField = page.getByRole('combobox', { name: 'Destino' });
    this.outboundDateField = page.getByRole('textbox', { name: /Fecha ida/ });
    this.searchButton = page.getByRole('button', { name: /Buscar billete/i });
    this.journeyList = page.getByRole('list', {
      name: /Lista de trenes disponibles para la ida/i,
    });
    this.journeys = this.journeyList
      .getByRole('link', { name: /Tren con salida/i })
      .locator('xpath=ancestor::*[@role="listitem"][1]')
      .filter({ hasText: /\d+(?:[.,]\d{1,2})?\s*€/ });
    this.selectJourneyButton = page.getByRole('button', {
      name: 'Seleccionar',
      exact: true,
    });
    this.basicFareConfirmation = page.getByRole('alertdialog');
    this.passengerDetailsStage = page.getByRole('link', { name: /Introduce tus datos/i });
    this.passengerDetailsTitle = page.getByText('DATOS DEL VIAJERO', { exact: true }).last();
  }

  async open(): Promise<void> {
    await this.page.goto('/');
  }

  async waitForJourneys(): Promise<void> {
    await this.journeys.first().waitFor({ state: 'visible', timeout: 30_000 });
  }

  async dismissBlockingNoticeIfVisible(timeout = 1_000): Promise<void> {
    const journeyNoticeHeading = this.page.getByRole('heading', {
      name: 'Viaje con aviso',
      exact: true,
    }).last();
    try {
      await journeyNoticeHeading.waitFor({ state: 'visible', timeout });
    } catch (error) {
      if (!(error instanceof Error && error.name === 'TimeoutError')) {
        throw error;
      }
    }

    if (await journeyNoticeHeading.isVisible()) {
      const notice = journeyNoticeHeading.locator('xpath=..');
      await notice.getByRole('button', { name: /close|cerrar/i }).click();
      await journeyNoticeHeading.waitFor({ state: 'hidden' });
      return;
    }

    const quietCarNotice = this.page.locator('#modalGeneric[role="alertdialog"]');
    if (await quietCarNotice.isVisible()) {
      await quietCarNotice.getByRole('button', { name: /close|cerrar/i }).click();
      await quietCarNotice.waitFor({ state: 'hidden' });
    }
  }

  async openFareDetails(journey: Locator): Promise<void> {
    await journey.getByRole('link', { name: /Tren con salida/i }).click();
  }

  async waitForPassengerDetailsStage(): Promise<void> {
    await this.passengerDetailsStage.waitFor({ state: 'visible' });
    await this.passengerDetailsTitle.waitFor({ state: 'visible' });
  }
}
