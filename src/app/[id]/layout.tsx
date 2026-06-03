import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let title = 'Irivia';
  let description = 'Plataforma de histórias colaborativas onde qualquer pessoa pode iniciar uma narrativa, criar continuações e votar nos próximos acontecimentos.';

  if (supabaseUrl && anonKey) {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/stories?id=eq.${encodeURIComponent(params.id)}&select=title,genre,participants,total_branches`,
        { headers: { apikey: anonKey }, signal: AbortSignal.timeout(2000) },
      );
      const stories = await res.json();
      const story = stories?.[0];
      if (story) {
        title = `${story.title} — Irivia`;
        description = `Gênero: ${story.genre} · ${story.participants || 0} autores · ${story.total_branches || 0} ramos. Leia, vote e contribua no Irivia.`;
      }
    } catch { /* fallback */ }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://irivia.app';
  const ogUrl = `${siteUrl}/api/og/${params.id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'Irivia',
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
