// Pricing has been removed from WellNest.
// This stub redirects any stale bookmarks to the home page.
import { Navigate } from 'react-router-dom';

export default function PricingPage() {
  return <Navigate to="/" replace />;
}
