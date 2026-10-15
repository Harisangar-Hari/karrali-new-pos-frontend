import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { router } from '@/router';
import type { AuthUser } from '@/types/auth';

export default function App() {
  const setUser = useAuthStore((s) => s.setUser);
  const setStatus = useAuthStore((s) => s.setStatus);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    (async () => {
      try {
        const { data } = await api.get<AuthUser>('/auth/me');
        if (!cancelled) setUser(data);
      } catch {
        // 401 (after refresh attempt) or network error → treat as no session.
        if (!cancelled) clear();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setUser, setStatus, clear]);

  return <RouterProvider router={router} />;
}