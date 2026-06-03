export function createChallengeUrl(storyId: string, type: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://irivia.app';
  const url = new URL(`${base}/${storyId}`);
  url.searchParams.set('challenge', type);
  url.searchParams.set('utm_source', 'challenge');
  url.searchParams.set('utm_medium', 'social');
  url.searchParams.set('utm_campaign', 'challenge');
  url.searchParams.set('ref_story', storyId);
  return url.toString();
}

export async function shareStory(storyId: string, title: string): Promise<void> {
  const url = `${window.location.origin}/${storyId}`;
  if (navigator.share) {
    await navigator.share({ title, text: `Leia "${title}" no Irivia!`, url });
  } else {
    await navigator.clipboard.writeText(url);
  }
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
