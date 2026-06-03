export interface Referral {
  source: string;
  medium: string;
  campaign: string;
  storyId?: string;
}

export function parseReferral(): Referral | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const source = params.get('utm_source');
  if (!source) return null;

  return {
    source: source.slice(0, 50),
    medium: params.get('utm_medium')?.slice(0, 50) || 'link',
    campaign: params.get('utm_campaign')?.slice(0, 50) || 'direct',
    storyId: params.get('ref_story')?.slice(0, 100) || undefined,
  };
}

export function detectReferrer(): string {
  if (typeof document === 'undefined') return 'direct';
  const ref = document.referrer.toLowerCase();
  if (ref.includes('whatsapp')) return 'whatsapp';
  if (ref.includes('instagram')) return 'instagram';
  if (ref.includes('tiktok')) return 'tiktok';
  if (ref.includes('facebook') || ref.includes('fb.com') || ref.includes('fb.me')) return 'facebook';
  if (ref.includes('twitter') || ref.includes('x.com') || ref.includes('t.co')) return 'twitter';
  if (ref.includes('google')) return 'google';
  if (ref.includes('bing')) return 'bing';
  if (ref) return 'other';
  return 'direct';
}

export function addUtmParams(baseUrl: string, source: string, campaign: string, storyId?: string): string {
  const url = new URL(baseUrl, typeof window !== 'undefined' ? window.location.origin : 'https://irivia.app');
  url.searchParams.set('utm_source', source);
  url.searchParams.set('utm_medium', 'social');
  url.searchParams.set('utm_campaign', campaign);
  if (storyId) url.searchParams.set('ref_story', storyId);
  return url.toString();
}

const STORAGE_KEY = 'irivia-referral-tracked';

export function wasReferralTracked(): boolean {
  if (typeof window === 'undefined') return true;
  return !!sessionStorage.getItem(STORAGE_KEY);
}

export function markReferralTracked(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEY, '1');
  }
}
