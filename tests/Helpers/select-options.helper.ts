import type { Locator } from '@playwright/test';

export async function selectOptions(
  field: Locator,
  option: Locator,
  searchText: string,
): Promise<void> {
  await field.fill(searchText);
  await option.waitFor({ state: 'visible' });
  await option.click();
}
