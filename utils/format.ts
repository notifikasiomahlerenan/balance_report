/** Format integer as IDR: Rp 1.234.567 */
export function formatIDR(amount: number): string {
  return 'Rp ' + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Format ISO date string for display: "07 Apr 2026" (Bahasa Indonesia) */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];
  return `${String(d).padStart(2, '0')} ${months[m - 1]} ${y}`;
}

/** Format ISO date string short: "07/04" */
export function formatDateShort(isoDate: string): string {
  const [, m, d] = isoDate.split('-');
  return `${d}/${m}`;
}

/** Get month key "YYYY-MM" from a Date */
export function toMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Get display label "April 2026" from month key (Bahasa Indonesia) */
export function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${months[m - 1]} ${y}`;
}

/** Shift a monthKey by +/- 1 month */
export function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return toMonthKey(d);
}

/** Reporter abbreviation for compact tables (e.g. "RZ", "AM", "A") */
export function reporterAbbrev(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const initials = parts.map((p) => p[0]?.toUpperCase()).filter(Boolean);
  const joined = initials.join('');
  if (joined.length >= 2) return joined.slice(0, 2);
  return trimmed.slice(0, 2).toUpperCase();
}
