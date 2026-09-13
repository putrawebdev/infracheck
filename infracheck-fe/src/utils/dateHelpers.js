/**
 * Centralized robust date & time formatting helpers.
 * Handles MySQL datetime strings ('YYYY-MM-DD HH:mm:ss'), timestamps,
 * and ISO strings without crashing or displaying 'Invalid Date'.
 * Supports dynamic user local timezone (e.g. WIB, WITA, WIT, or user's local TZ).
 */

const parseDateSafe = (dateInput) => {
  if (!dateInput) return null;
  try {
    let parseable = dateInput;
    if (typeof dateInput === 'string') {
      const trimmed = dateInput.trim();
      if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
      // Handle MySQL format "2026-08-20 13:23:57"
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(trimmed)) {
        parseable = trimmed.replace(' ', 'T');
      }
    }
    const d = new Date(parseable);
    if (!isNaN(d.getTime())) return d;

    const num = Number(dateInput);
    if (!isNaN(num) && num > 0) {
      const dNum = new Date(num);
      if (!isNaN(dNum.getTime())) return dNum;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Format a date safely into a localized date string (e.g. "20 Agu 2026")
 */
export const formatDateSafe = (
  dateInput,
  options = { day: 'numeric', month: 'short', year: 'numeric' },
  locale = 'id-ID'
) => {
  const d = parseDateSafe(dateInput);
  if (!d) return 'Hari ini';
  return d.toLocaleDateString(locale, options);
};

/**
 * Format date & time safely (e.g. "20/8/2026, 14.30.00")
 */
export const formatDateTimeSafe = (dateInput, locale = 'id-ID') => {
  const d = parseDateSafe(dateInput);
  if (!d) return new Date().toLocaleString(locale);
  return d.toLocaleString(locale);
};

/**
 * Format date & time with dynamic browser local timezone name (e.g. "14.30 WIB • 20 Agu 2026")
 * Replaces hardcoded 'WIB' so users in WITA, WIT, or other regions see their real local time.
 */
export const formatLocalDateTime = (dateInput, locale = 'id-ID') => {
  const d = parseDateSafe(dateInput);
  if (!d) return 'Hari ini';

  try {
    // Get localized time with short timezone name (e.g. "14.30 WIB" or "15.30 WITA")
    const timeWithTz = d.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const dateFormatted = d.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return `${timeWithTz} • ${dateFormatted}`;
  } catch {
    return d.toLocaleDateString(locale);
  }
};
