export function sanitizeString(input: string, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>&"']/g, '')
    .replace(/\\/g, '')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeUsername(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[^a-zA-Z0-9_\u00C0-\u024F\s]/g, '')
    .trim()
    .slice(0, 30);
}

export function sanitizePassword(input: string): string {
  if (typeof input !== 'string') return '';
  return input.normalize('NFKC').slice(0, 128);
}

export function validatePattern(pattern: number[], gridSize = 20): boolean {
  if (!Array.isArray(pattern)) return false;
  if (pattern.length < 3 || pattern.length > 4) return false;
  return pattern.every(i => Number.isInteger(i) && i >= 0 && i < gridSize);
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return 'h2_' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxAttempts = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxAttempts) return false;
  entry.count++;
  return true;
}
