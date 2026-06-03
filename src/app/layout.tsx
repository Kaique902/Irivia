import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import ClientLayout from '@/components/layout/ClientLayout';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Irivia | Onde a comunidade decide o próximo capítulo',
  description: 'Plataforma de histórias colaborativas onde qualquer pessoa pode iniciar uma narrativa, criar continuações e votar nos próximos acontecimentos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <meta name="theme-color" content="#09090b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL.replace('/rest/v1', '')} />
        )}
      </head>
      <body className={inter.className}>
        <ClientLayout>
          {children}
          <footer className="border-t border-[#27272a] py-8 px-4 mt-12">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
              <span>&copy; {new Date().getFullYear()} Irivia</span>
              <div className="flex gap-4">
                <a href="/termos" className="hover:text-zinc-400">Termos de Uso</a>
                <a href="/privacidade" className="hover:text-zinc-400">Privacidade</a>
              </div>
            </div>
          </footer>
        </ClientLayout>
        <Script src="/sw-register.js" strategy="afterInteractive" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
