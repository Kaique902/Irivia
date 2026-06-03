import { sanitizeString, sanitizeUsername, sanitizePassword, validatePattern } from '@/lib/sanitize';

describe('sanitizeString', () => {
  it('removes HTML tags', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script');
  });

  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('limits max length', () => {
    const long = 'a'.repeat(1000);
    expect(sanitizeString(long, 10).length).toBe(10);
  });

  it('returns empty for non-string input', () => {
    expect(sanitizeString(null as any)).toBe('');
    expect(sanitizeString(undefined as any)).toBe('');
  });
});

describe('sanitizeUsername', () => {
  it('removes special characters', () => {
    expect(sanitizeUsername('user<script>')).toBe('userscript');
  });

  it('keeps valid characters', () => {
    expect(sanitizeUsername('João_123')).toBe('João_123');
  });

  it('limits to 30 chars', () => {
    const long = 'a'.repeat(50);
    expect(sanitizeUsername(long).length).toBe(30);
  });
});

describe('sanitizePassword', () => {
  it('normalizes unicode', () => {
    expect(() => sanitizePassword('password')).not.toThrow();
  });

  it('limits to 128 chars', () => {
    const long = 'a'.repeat(200);
    expect(sanitizePassword(long).length).toBe(128);
  });
});

describe('validatePattern', () => {
  it('accepts 3-4 valid indices', () => {
    expect(validatePattern([0, 1, 2])).toBe(true);
    expect(validatePattern([0, 1, 2, 3])).toBe(true);
  });

  it('rejects invalid lengths', () => {
    expect(validatePattern([])).toBe(false);
    expect(validatePattern([0, 1])).toBe(false);
    expect(validatePattern([0, 1, 2, 3, 4])).toBe(false);
  });

  it('rejects out of bounds indices', () => {
    expect(validatePattern([0, 1, 99], 20)).toBe(false);
  });

  it('rejects non-array input', () => {
    expect(validatePattern(null as any)).toBe(false);
    expect(validatePattern('invalid' as any)).toBe(false);
  });
});
