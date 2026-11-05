import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { safeApiFetch } from '../utils/apiFetch';

export function useAuthenticatedApi<T>(endpoint: string, enabled = true) {
  const { user, session } = useAuth();
  const token = session?.access_token;
  const query = useQuery({
    queryKey: ['authenticated-api', user?.id, endpoint],
    enabled: Boolean(enabled && user && token),
    staleTime: 5_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const result = await safeApiFetch<T>(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  return {
    ...query,
    error: !token ? new Error('Your authenticated session is not ready.') : query.error,
    isError: !token || query.isError,
  };
}
