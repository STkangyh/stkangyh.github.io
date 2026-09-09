// 2026-09-08T… -> "2026.09.08". UTC so a build machine's timezone cannot
// shift a published date by a day.
export const dateLabel = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}.${p(d.getUTCMonth() + 1)}.${p(d.getUTCDate())}`;
};
