import { useAuth } from '../../providers/AuthProvider';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { Alert } from '../ui/Alert';

export function PortalDataStatus() {
  const { role } = useAuth();
  const endpoint = role === 'hospital' ? '/api/hospital/entries' : role === 'administrator' ? '/api/admin/users' : role === 'laboratory' ? '/api/lab/orders' : role === 'pharmacy' ? '/api/pharmacy/prescriptions' : role === 'insurance' ? '/api/insurance/claims' : role==='doctor'||role==='patient'?'/api/appointments':'';
  const query = useAuthenticatedApi<unknown>(endpoint, Boolean(endpoint));
  if (!endpoint) return null;
  if (query.isLoading) return <p role="status" className="mb-4 text-sm text-ink-500">Loading your organization’s saved data…</p>;
  if (!query.isError) return null;
  return <Alert tone="error" title="Workspace data is unavailable" className="mb-5">{query.error?.message} <button className="font-semibold underline" onClick={() => void query.refetch()}>Retry</button></Alert>;
}
