import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { safeApiFetch } from '../utils/apiFetch';

export interface HealthIdentity {
  id: number;
  user_id: string;
  health_id: string;
  display_name: string;
  city: string;
  created_at?: string;
}

export function useHealthIdentity() {
  const { user, session } = useAuth();
  const token = session?.access_token;
  const query = useQuery({
    queryKey: ['health-identity', user?.id],
    enabled: Boolean(user && token),
    queryFn: async () => {
      const headers = { Authorization: `Bearer ${token}` };
      let result = await safeApiFetch<HealthIdentity & { success: boolean }>('/api/health-id', { headers });
      if (!result.ok) {
        if (result.status !== 404) throw new Error(result.error);
        result = await safeApiFetch<HealthIdentity & { success: boolean }>('/api/health-id', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (!result.ok) throw new Error(result.error);
      }
      return result.data;
    },
  });
  const error = !user
    ? new Error('Sign in to view your Health ID.')
    : !token
      ? new Error('Your session is not ready. Please sign in again.')
      : query.error;
  return {
    identity: query.data ?? null,
    loading: Boolean(user && token && query.isLoading),
    error: error instanceof Error ? error.message : '',
    refresh: () => query.refetch(),
  };
}
