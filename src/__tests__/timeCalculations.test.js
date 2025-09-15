import { addBusinessDays, businessDaysBetween, calculateElapsedAndDelay } from '../utils/timeCalculations';

describe('timeCalculations utility', () => {
  test('addBusinessDays skips weekends', () => {
    const start = new Date('2024-06-28'); // Friday
    const result = addBusinessDays(start, 1);
    expect(result.getDay()).toBe(1); // Monday
    expect(result.toISOString().split('T')[0]).toBe('2024-07-01');
  });

  test('businessDaysBetween counts inclusive days', () => {
    const start = new Date('2024-06-28'); // Friday
    const end = new Date('2024-07-02'); // Tuesday
    expect(businessDaysBetween(start, end)).toBe(3); // Fri, Mon, Tue
  });

  test('calculateElapsedAndDelay computes elapsed and delay', () => {
    const start = new Date('2024-06-28');
    const due = new Date('2024-07-03');
    const today = new Date('2024-07-04');
    const result = calculateElapsedAndDelay(start, due, today, 18, 9);
    expect(result).toEqual({
      elapsedDays: 4,
      elapsedEffectiveHours: 18,
      delayHours: 9,
      delayDays: 1,
      capacityHoursUntilDue: 27,
      capacityDaysUntilDue: 3,
    });
  });
});
