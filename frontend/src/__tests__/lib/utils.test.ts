/**
 * Utility Functions Tests
 */

import {
  cn,
  formatNumber,
  formatDate,
  formatTime,
  formatRelativeTime,
  getWindDirection,
  generateId,
} from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn (classNames)', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
      expect(cn('foo', undefined, 'bar')).toBe('foo bar');
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('should handle Tailwind class conflicts', () => {
      // Later classes should override earlier ones
      expect(cn('px-2', 'px-4')).toBe('px-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with default decimals', () => {
      expect(formatNumber(25.567)).toBe('25.6');
      expect(formatNumber(10)).toBe('10.0');
    });

    it('should format numbers with specified decimals', () => {
      expect(formatNumber(25.567, 2)).toBe('25.57');
      expect(formatNumber(25.567, 0)).toBe('26');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2026-02-01T12:00:00Z');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/Feb/);
      expect(formatted).toMatch(/2026/);
    });

    it('should handle string dates', () => {
      const formatted = formatDate('2026-02-01T12:00:00Z');
      expect(formatted).toMatch(/Feb/);
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const date = new Date('2026-02-01T14:30:45Z');
      const formatted = formatTime(date);
      expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "just now" for recent times', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('just now');
    });

    it('should return minutes ago', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinAgo)).toBe('5 minutes ago');
    });

    it('should return hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo)).toBe('2 hours ago');
    });

    it('should return days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
    });
  });

  describe('getWindDirection', () => {
    it('should return correct cardinal directions', () => {
      expect(getWindDirection(0)).toBe('N');
      expect(getWindDirection(90)).toBe('E');
      expect(getWindDirection(180)).toBe('S');
      expect(getWindDirection(270)).toBe('W');
    });

    it('should return correct intercardinal directions', () => {
      expect(getWindDirection(45)).toBe('NE');
      expect(getWindDirection(135)).toBe('SE');
      expect(getWindDirection(225)).toBe('SW');
      expect(getWindDirection(315)).toBe('NW');
    });

    it('should handle edge cases', () => {
      expect(getWindDirection(360)).toBe('N');
      expect(getWindDirection(359)).toBe('N');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });
  });
});
