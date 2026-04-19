export const COMMON_TIMEZONES = [
  { label: 'Auto-detect Location', value: 'auto' },
  { label: 'UTC (Greenwich Mean Time)', value: 'UTC' },
  
  // Asia
  { label: 'Pakistan Standard Time (Karachi) (GMT+5)', value: 'Asia/Karachi' },
  { label: 'India Standard Time (Kolkata) (GMT+5:30)', value: 'Asia/Kolkata' },
  { label: 'Gulf Standard Time (Dubai) (GMT+4)', value: 'Asia/Dubai' },
  { label: 'Saudi Arabia Standard Time (GMT+3)', value: 'Asia/Riyadh' },
  { label: 'Singapore Standard Time (GMT+8)', value: 'Asia/Singapore' },
  { label: 'Japan/Korea Standard Time (Tokyo) (GMT+9)', value: 'Asia/Tokyo' },
  
  // Europe
  { label: 'United Kingdom (London) (GMT/BST)', value: 'Europe/London' },
  { label: 'Central European Time (Paris/Berlin) (GMT+1)', value: 'Europe/Paris' },
  { label: 'Eastern European Time (Athens/Cairo) (GMT+2)', value: 'Europe/Athens' },
  
  // America
  { label: 'Eastern Time (US & Canada) (GMT-5)', value: 'America/New_York' },
  { label: 'Central Time (US & Canada) (GMT-6)', value: 'America/Chicago' },
  { label: 'Mountain Time (US & Canada) (GMT-7)', value: 'America/Denver' },
  { label: 'Pacific Time (US & Canada) (GMT-8)', value: 'America/Los_Angeles' },
  { label: 'Atlantic Time (Halifax) (GMT-4)', value: 'America/Halifax' },
  
  // Australia / Oceania
  { label: 'Australian Eastern Time (Sydney) (GMT+10)', value: 'Australia/Sydney' },
  { label: 'New Zealand Standard Time (Auckland) (GMT+12)', value: 'Australia/Auckland' },
  
  // Africa
  { label: 'South Africa Standard Time (Johannesburg) (GMT+2)', value: 'Africa/Johannesburg' },
  { label: 'West Africa Time (Lagos) (GMT+1)', value: 'Africa/Lagos' },
];

export const getDeviceTimezone = () => {
  try {
    // Some older environments might not have Intl, fallback to UTC or a generic guess
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || 'UTC';
  } catch (_e) {
    console.warn('[TimeUtils] Could not detect device timezone, falling back to UTC');
    return 'UTC';
  }
};
