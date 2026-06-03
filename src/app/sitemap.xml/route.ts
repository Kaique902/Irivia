import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

const STATIC_ROUTES = [
  '', '/auth', '/ranking', '/offline', '/create',
  '/termos', '/privacidade',
];

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://irivia.app';

  let storyUrls = '';
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const { data } = await client.from('stories').select('id, created_at').limit(1000);
      if (data) {
        storyUrls = data.map(s => `
  <url>
    <loc>${baseUrl}/${s.id}</loc>
    <lastmod>${s.created_at || new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('');
      }
    } catch {}
  }

  const staticUrls = STATIC_ROUTES.map(path => `
  <url>
    <loc>${baseUrl}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === '' ? '1.0' : '0.6'}</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls}
  ${storyUrls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
