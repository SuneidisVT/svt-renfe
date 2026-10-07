export function parseEuroAmount(value: string): number | null {
  const match = value.match(/(\d{1,3}(?:[.\s]\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*€/);
  if (!match) return null;

  return Number(match[1].replace(/\./g, '').replace(',', '.').replace(/\s/g, ''));
}

export function isFareWithinRange(
  amount: number | null,
  minimum: number,
  maximum: number,
): amount is number {
  return amount !== null && amount >= minimum && amount <= maximum;
}
