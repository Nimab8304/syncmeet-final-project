// client/src/utils/tz.js
export const getLocalTimeZone = () =>
  (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
