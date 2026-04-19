import { getDeviceTimezone } from './timezones';
import { format } from 'date-fns-tz';

/**
 * Resolves the target timezone based on user preference.
 * If preference is 'auto', defaults to device timezone.
 */
export const resolveUserTimezone = (preference) => {
  if (!preference || preference === 'auto') {
    return getDeviceTimezone();
  }
  return preference;
};

/**
 * Formats a date into a localized YYYY-MM-DD string for a specific timezone.
 * This ensures that day-boundaries are respected based on the USER'S selected TZ.
 */
export const getLocalDateString = (date = new Date(), timezone = 'auto') => {
  const tz = resolveUserTimezone(timezone);
  
  // Use Intl to format the date in the target timezone
  const formatter = new Intl.DateTimeFormat('en-CA', { // en-CA gives YYYY-MM-DD
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: tz
  });
  
  return formatter.format(date);
};

/**
 * Formats a UTC string/date to a localized time string.
 * @param {string|Date} date - UTC time
 * @param {string} timezone - Target timezone (e.g. 'Asia/Karachi')
 */
export const formatToLocalTime = (date, timezone = 'auto') => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const tz = resolveUserTimezone(timezone);

  return format(d, 'hh:mm a', { timeZone: tz });
};

/**
 * Formats a UTC string/date to a localized full date string.
 */
export const formatToLocalDate = (date, timezone = 'auto') => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const tz = resolveUserTimezone(timezone);

  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: tz
  });
};
