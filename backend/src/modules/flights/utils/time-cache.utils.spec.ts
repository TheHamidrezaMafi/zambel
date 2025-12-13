import {
  isDataFresh,
  getDataAgeMinutes,
  getDataAgeReadable,
  getCacheValidity,
  getTimeUntilCacheExpires,
  getFreshestItem,
  hasAnyFreshItem,
  formatDateYYYYMMDD,
  compareDates,
  checkCacheValidityBatch,
} from './time-cache.utils';

describe('Time & Cache Utilities', () => {
  describe('isDataFresh', () => {
    it('should return true for data less than maxAgeMinutes old', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
      expect(isDataFresh(fiveMinutesAgo, 60)).toBe(true);
    });

    it('should return false for data older than maxAgeMinutes', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60000);
      expect(isDataFresh(twoHoursAgo, 60)).toBe(false);
    });

    it('should accept string dates', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString();
      expect(isDataFresh(fiveMinutesAgo, 60)).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(isDataFresh(null as any, 60)).toBe(false);
      expect(isDataFresh(undefined as any, 60)).toBe(false);
    });

    it('should default to 60 minutes max age', () => {
      const fiftyNineMinutesAgo = new Date(Date.now() - 59 * 60000);
      expect(isDataFresh(fiftyNineMinutesAgo)).toBe(true);

      const sixtyOneMinutesAgo = new Date(Date.now() - 61 * 60000);
      expect(isDataFresh(sixtyOneMinutesAgo)).toBe(false);
    });
  });

  describe('getDataAgeMinutes', () => {
    it('should return 0 for current date', () => {
      expect(getDataAgeMinutes(new Date())).toBe(0);
    });

    it('should return age in minutes', () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60000);
      const age = getDataAgeMinutes(tenMinutesAgo);
      expect(age).toBe(10);
    });

    it('should accept string dates', () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60000).toISOString();
      const age = getDataAgeMinutes(tenMinutesAgo);
      expect(age).toBe(10);
    });

    it('should return -1 for invalid dates', () => {
      expect(getDataAgeMinutes('invalid-date')).toBe(-1);
    });

    it('should return 0 for future dates', () => {
      const futureDate = new Date(Date.now() + 10 * 60000);
      expect(getDataAgeMinutes(futureDate)).toBe(0);
    });
  });

  describe('getDataAgeReadable', () => {
    it('should return "just now" for very recent data', () => {
      const oneSecondAgo = new Date(Date.now() - 1000);
      expect(getDataAgeReadable(oneSecondAgo)).toBe('just now');
    });

    it('should return minutes for data < 1 hour old', () => {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60000);
      expect(getDataAgeReadable(thirtyMinutesAgo)).toContain('30 minute');
    });

    it('should return hours for data < 24 hours old', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60000);
      expect(getDataAgeReadable(twoHoursAgo)).toContain('2 hour');
    });

    it('should return days for older data', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60000);
      expect(getDataAgeReadable(threeDaysAgo)).toContain('3 day');
    });

    it('should handle singular forms', () => {
      const oneMinuteAgo = new Date(Date.now() - 1 * 60000);
      expect(getDataAgeReadable(oneMinuteAgo)).toContain('1 minute');

      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60000);
      expect(getDataAgeReadable(oneHourAgo)).toContain('1 hour');

      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60000);
      expect(getDataAgeReadable(oneDayAgo)).toContain('1 day');
    });
  });

  describe('getCacheValidity', () => {
    it('should return valid status for fresh data', () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60000);
      const validity = getCacheValidity(tenMinutesAgo, 60);

      expect(validity.valid).toBe(true);
      expect(validity.ageMinutes).toBe(10);
    });

    it('should return invalid status for stale data', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60000);
      const validity = getCacheValidity(twoHoursAgo, 60);

      expect(validity.valid).toBe(false);
      expect(validity.ageMinutes).toBeGreaterThan(60);
    });

    it('should calculate percent of max age correctly', () => {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60000);
      const validity = getCacheValidity(thirtyMinutesAgo, 60);

      expect(validity.percentOfMaxAge).toBe(50);
    });
  });

  describe('getTimeUntilCacheExpires', () => {
    it('should return "expired" for stale cache', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60000);
      expect(getTimeUntilCacheExpires(twoHoursAgo, 60)).toBe('expired');
    });

    it('should return minutes remaining for fresh cache', () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60000);
      const remaining = getTimeUntilCacheExpires(tenMinutesAgo, 60);
      expect(remaining).toContain('minute');
      expect(remaining).toContain('50'); // ~50 minutes remaining
    });

    it('should return hours for cache expiring in hours', () => {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60000);
      const remaining = getTimeUntilCacheExpires(thirtyMinutesAgo, 120);
      expect(remaining).toContain('hour');
    });
  });

  describe('getFreshestItem', () => {
    it('should return null for empty array', () => {
      expect(getFreshestItem([], 'updatedAt')).toBeNull();
    });

    it('should return the most recently updated item', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60000);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);

      const items = [
        { id: 1, updatedAt: oneHourAgo },
        { id: 2, updatedAt: fiveMinutesAgo },
        { id: 3, updatedAt: new Date(Date.now() - 10 * 60000) },
      ];

      const freshest = getFreshestItem(items, 'updatedAt');
      expect(freshest?.id).toBe(2);
    });
  });

  describe('hasAnyFreshItem', () => {
    it('should return false for empty array', () => {
      expect(hasAnyFreshItem([], 'updatedAt', 60)).toBe(false);
    });

    it('should return true if any item is fresh', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60000);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);

      const items = [
        { id: 1, updatedAt: oneHourAgo },
        { id: 2, updatedAt: fiveMinutesAgo },
      ];

      expect(hasAnyFreshItem(items, 'updatedAt', 60)).toBe(true);
    });

    it('should return false if no items are fresh', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60000);
      const oneHourAndFiveMinutesAgo = new Date(Date.now() - 65 * 60000);

      const items = [
        { id: 1, updatedAt: twoHoursAgo },
        { id: 2, updatedAt: oneHourAndFiveMinutesAgo },
      ];

      expect(hasAnyFreshItem(items, 'updatedAt', 60)).toBe(false);
    });
  });

  describe('formatDateYYYYMMDD', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-12-15T10:30:00');
      expect(formatDateYYYYMMDD(date)).toBe('2025-12-15');
    });

    it('should handle string dates', () => {
      expect(formatDateYYYYMMDD('2025-12-15T10:30:00')).toBe('2025-12-15');
    });
  });

  describe('compareDates', () => {
    it('should return 0 for same date', () => {
      const date = new Date('2025-12-15');
      expect(compareDates(date, date)).toBe(0);
    });

    it('should return negative for earlier date', () => {
      expect(compareDates('2025-12-14', '2025-12-15')).toBeLessThan(0);
    });

    it('should return positive for later date', () => {
      expect(compareDates('2025-12-16', '2025-12-15')).toBeGreaterThan(0);
    });

    it('should ignore time component', () => {
      const date1 = new Date('2025-12-15T10:00:00');
      const date2 = new Date('2025-12-15T20:00:00');
      expect(compareDates(date1, date2)).toBe(0);
    });
  });

  describe('checkCacheValidityBatch', () => {
    it('should check validity for multiple items', () => {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60000);
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60000);

      const items = [
        {
          origin: 'THR',
          destination: 'MHD',
          date: '2025-12-15',
          lastUpdated: thirtyMinutesAgo,
        },
        {
          origin: 'THR',
          destination: 'ISF',
          date: '2025-12-15',
          lastUpdated: twoHoursAgo,
        },
      ];

      const validity = checkCacheValidityBatch(items, 60);

      expect(validity).toHaveLength(2);
      expect(validity[0].cacheValid).toBe(true);
      expect(validity[1].cacheValid).toBe(false);
    });
  });
});
