// Dates as the lists show them, e.g. 26 Sep 2026 (en-IN would print Sept)
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
