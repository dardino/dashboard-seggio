export function formatLastUpdatedAt(value: string | null): string {
  if (!value) {
    return 'nessun rilevamento';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'nessun rilevamento';
  }

  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}
