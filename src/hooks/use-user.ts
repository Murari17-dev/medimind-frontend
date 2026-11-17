import useSWR from 'swr';

import { supabase } from '@/lib/supabase';

export function useUserEmail() {
  const { data } = useSWR('auth:user-email', async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user.email ?? null;
  });

  return data ?? null;
}
