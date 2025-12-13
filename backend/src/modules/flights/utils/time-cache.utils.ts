/**
 * Time and Cache Utility Functions
 * Provides helper functions for time-based operations and cache freshness checks
 */

/**
 * Check if data is fresh (within specified minutes)
 * @param lastUpdated - Date when data was last updated
 * @param maxAgeMinutes - Maximum age in minutes (default: 60)
 * @returns true if data is fresh, false if stale
 */
export function isDataFresh(lastUpdated: Date | string, maxAgeMinutes: number = 60): boolean {
  if (!lastUpdated) return false;

  const updateTime = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated;
  const ageMinutes = (Date.now() - updateTime.getTime()) / 60000;

  return ageMinutes < maxAgeMinutes;
}

/**
 * Get age of data in minutes
 * @param lastUpdated - Date when data was last updated
 * @returns Age in minutes, or -1 if date is invalid
 */
export function getDataAgeMinutes(lastUpdated: Date | string): number {
  if (!lastUpdated) return -1;

  try {
    const updateTime = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated;
    const ageMs = Date.now() - updateTime.getTime();
    
    if (ageMs < 0) return 0; // Future date
    
    return Math.round(ageMs / 60000);
  } catch {
    return -1;
  }
}

/**
 * Get age of data in a human-readable format
 * @param lastUpdated - Date when data was last updated
 * @returns Human-readable age string (e.g., "5 minutes ago", "2 hours ago")
 */
export function getDataAgeReadable(lastUpdated: Date | string): string {
  const ageMinutes = getDataAgeMinutes(lastUpdated);

  if (ageMinutes === -1) return 'unknown';
  if (ageMinutes < 1) return 'just now';
  if (ageMinutes < 60) return `${ageMinutes} minute${ageMinutes === 1 ? '' : 's'} ago`;

  const ageHours = Math.floor(ageMinutes / 60);
  if (ageHours < 24) return `${ageHours} hour${ageHours === 1 ? '' : 's'} ago`;

  const ageDays = Math.floor(ageHours / 24);
  return `${ageDays} day${ageDays === 1 ? '' : 's'} ago`;
}

/**
 * Check if any item in array is fresh
 * @param items - Array of objects with lastUpdated date
 * @param dateKey - Key name for the date field
 * @param maxAgeMinutes - Maximum age in minutes
 * @returns true if at least one item is fresh
 */
export function hasAnyFreshItem<T extends Record<string, any>>(
  items: T[],
  dateKey: keyof T,
  maxAgeMinutes: number = 60,
): boolean {
  if (!items || items.length === 0) return false;
  return items.some((item) => isDataFresh(item[dateKey] as Date | string, maxAgeMinutes));
}

/**
 * Get the freshest item from array
 * @param items - Array of objects with lastUpdated date
 * @param dateKey - Key name for the date field
 * @returns The most recently updated item, or null
 */
export function getFreshestItem<T extends Record<string, any>>(
  items: T[],
  dateKey: keyof T,
): T | null {
  if (!items || items.length === 0) return null;

  return items.reduce((latest, current) => {
    const latestTime = new Date(latest[dateKey] as string | Date).getTime();
    const currentTime = new Date(current[dateKey] as string | Date).getTime();
    return currentTime > latestTime ? current : latest;
  });
}

/**
 * Calculate cache validity
 * @param lastUpdated - Date when data was last updated
 * @param maxAgeMinutes - Maximum age in minutes
 * @returns Object with cacheValid flag and age info
 */
export function getCacheValidity(
  lastUpdated: Date | string,
  maxAgeMinutes: number = 60,
): {
  valid: boolean;
  ageMinutes: number;
  ageHours: number;
  readable: string;
  percentOfMaxAge: number;
} {
  const ageMinutes = getDataAgeMinutes(lastUpdated);
  const ageHours = Math.round(ageMinutes / 60);
  const percentOfMaxAge = Math.round((ageMinutes / maxAgeMinutes) * 100);

  return {
    valid: ageMinutes < maxAgeMinutes,
    ageMinutes,
    ageHours,
    readable: getDataAgeReadable(lastUpdated),
    percentOfMaxAge,
  };
}

/**
 * Format time remaining before cache expires
 * @param lastUpdated - Date when data was last updated
 * @param maxAgeMinutes - Maximum age in minutes
 * @returns Time remaining string, or "expired" if cache is stale
 */
export function getTimeUntilCacheExpires(
  lastUpdated: Date | string,
  maxAgeMinutes: number = 60,
): string {
  const ageMinutes = getDataAgeMinutes(lastUpdated);
  const remainingMinutes = maxAgeMinutes - ageMinutes;

  if (remainingMinutes <= 0) return 'expired';
  if (remainingMinutes < 60) return `${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`;

  const remainingHours = Math.round(remainingMinutes / 60);
  return `${remainingHours} hour${remainingHours === 1 ? '' : 's'}`;
}

/**
 * Convert minutes to milliseconds
 */
export function minutesToMs(minutes: number): number {
  return minutes * 60000;
}

/**
 * Convert hours to milliseconds
 */
export function hoursToMs(hours: number): number {
  return hours * 3600000;
}

/**
 * Get start of day for a given date
 */
export function getStartOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day for a given date
 */
export function getEndOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDateYYYYMMDD(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Compare two dates (ignoring time)
 * @returns 0 if same day, negative if d1 is earlier, positive if d1 is later
 */
export function compareDates(d1: Date | string, d2: Date | string): number {
  const date1 = new Date(typeof d1 === 'string' ? d1 : d1.toISOString());
  const date2 = new Date(typeof d2 === 'string' ? d2 : d2.toISOString());

  date1.setHours(0, 0, 0, 0);
  date2.setHours(0, 0, 0, 0);

  return date1.getTime() - date2.getTime();
}

/**
 * Batch check cache validity for multiple routes
 */
export function checkCacheValidityBatch(
  items: Array<{
    origin: string;
    destination: string;
    date: string;
    lastUpdated: Date | string;
  }>,
  maxAgeMinutes: number = 60,
): Array<{
  origin: string;
  destination: string;
  date: string;
  cacheValid: boolean;
  ageMinutes: number;
  timeUntilExpire: string;
}> {
  return items.map((item) => {
    const validity = getCacheValidity(item.lastUpdated, maxAgeMinutes);
    return {
      origin: item.origin,
      destination: item.destination,
      date: item.date,
      cacheValid: validity.valid,
      ageMinutes: validity.ageMinutes,
      timeUntilExpire: getTimeUntilCacheExpires(item.lastUpdated, maxAgeMinutes),
    };
  });
}
