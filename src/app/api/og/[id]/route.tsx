import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return new Response('Supabase not configured', { status: 500 });
  }

  let title = '';
  let genre = '';
  let author = '';
  let branches = 0;
  let participants = 0;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/stories?id=eq.${encodeURIComponent(id)}&select=*`, {
      headers: { apikey: anonKey },
      signal: AbortSignal.timeout(3000),
    });
    const stories: any[] = await res.json();
    const story = stories?.[0];
    if (story) {
      title = story.title || '';
      genre = story.genre || '';
      branches = story.total_branches ?? 0;
      participants = story.participants ?? 0;
      if (story.author_id) {
        try {
          const pRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${story.author_id}&select=username`, {
            headers: { apikey: anonKey },
            signal: AbortSignal.timeout(2000),
          });
          const profiles: any[] = await pRes.json();
          author = profiles?.[0]?.username || '';
        } catch { /* ignore */ }
      }
    }
  } catch {
    // fallback: render with empty data
  }

  if (!title) {
    return new Response('Story not found', { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#09090b',
          color: '#fafafa',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexWrap: 'wrap',
            opacity: 0.06,
          }}
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '12.5%',
                height: '12.5%',
                borderRight: '1px solid #f97316',
                borderBottom: '1px solid #f97316',
              }}
            />
          ))}
        </div>

        {/* Accent bar top */}
        <div
          style={{
            width: '100%',
            height: 6,
            backgroundColor: '#f97316',
          }}
        />

        {/* Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '48px 64px',
            position: 'relative',
          }}
        >
          {/* Genre tag */}
          {genre && (
            <div
              style={{
                display: 'flex',
                padding: '6px 16px',
                backgroundColor: 'rgba(249, 115, 22, 0.15)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: 999,
                fontSize: 18,
                color: '#f97316',
                marginBottom: 20,
                width: 'fit-content',
              }}
            >
              {genre}
            </div>
          )}

          {/* Title */}
          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: 16,
              color: '#fafafa',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </div>

          {/* Author */}
          {author && (
            <div
              style={{
                fontSize: 22,
                color: '#a1a1aa',
                marginBottom: 28,
              }}
            >
              ✍️ por {author}
            </div>
          )}

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              fontSize: 18,
              color: '#71717a',
            }}
          >
            <span>🌿 {branches} ramos</span>
            <span>👥 {participants} autores</span>
          </div>
        </div>

        {/* Brand bottom */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px 64px',
            borderTop: '1px solid #27272a',
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#f97316',
            }}
          >
            Irivia
          </div>
          <div
            style={{
              fontSize: 16,
              color: '#52525b',
            }}
          >
            irivia.app
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
