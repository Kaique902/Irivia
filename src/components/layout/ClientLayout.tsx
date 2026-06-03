'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { parseReferral, detectReferrer, markReferralTracked, wasReferralTracked } from '@/lib/referral';
import { dbTrackReferral } from '@/lib/db';
import InstallPrompt from '@/components/ui/InstallPrompt';
import FeedbackPrompt from '@/components/ui/FeedbackPrompt';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const tracked = useRef(false);

  // Track referral once per session
  useEffect(() => {
    if (tracked.current || wasReferralTracked()) return;
    tracked.current = true;

    const referral = parseReferral();
    if (referral) {
      dbTrackReferral(referral.source, referral.medium, referral.campaign, referral.storyId);
      markReferralTracked();
    } else {
      const referrer = detectReferrer();
      if (referrer !== 'direct') {
        dbTrackReferral(referrer, 'referrer', 'direct');
        markReferralTracked();
      }
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { user, logout } = useStore.getState();
      if (!user) return;

      const { getBrowserClient, supabaseUrl, supabaseAnonKey } = await import('@/lib/supabase');
      if (!supabaseUrl || !supabaseAnonKey) return;

      const supabase = await getBrowserClient();
      if (!supabase) {
        await logout();
        if (pathname !== '/auth') router.push('/auth');
      }
    };
    checkSession();
  }, [pathname, router]);

  useEffect(() => {
    const { user, recordVisit } = useStore.getState();
    if (user && pathname !== '/auth' && pathname !== '/offline') {
      recordVisit();
    }
  }, [pathname]);

  return (
    <>
      {children}
      <InstallPrompt />
      <FeedbackPrompt />
    </>
  );
}
