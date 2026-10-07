import type { Page } from '@playwright/test';

export async function acceptCookieConsentIfVisible(page: Page): Promise<void> {
  const acceptButton = page.getByRole('button', {
    name: /aceptar todas las cookies|accept all cookies/i,
  });

  try {
    await acceptButton.waitFor({ state: 'visible', timeout: 3_000 });
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return;
    }
    throw error;
  }

  await acceptButton.click();
}
