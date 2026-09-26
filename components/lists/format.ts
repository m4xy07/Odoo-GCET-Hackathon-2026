// Dates as the lists show them, e.g. 26 Sep 2026
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
