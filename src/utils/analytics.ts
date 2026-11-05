export function seriesByDate(dates: Array<string | null | undefined>, limit = 9): number[] {
  const counts = new Map<string, number>();
  for (const value of dates) {
    if (!value) continue;
    const date = value.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) continue;
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-limit)
    .map(([, count]) => count);
}
