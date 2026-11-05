import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authReturnOnPageLoad, hasAuthReturnParameters, readGoogleSignIn } from '../../lib/authRedirect';
import { paths } from '../../routes/paths';

/** Some OAuth configurations return to the site root. Finish sign-in there too. */
export function AuthReturnRecovery({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (location.pathname === '/' && (readGoogleSignIn() || authReturnOnPageLoad || hasAuthReturnParameters(location.search, location.hash))) {
    return <Navigate to={{ pathname: paths.authCallback, search: location.search, hash: location.hash }} replace />;
  }
  return children;
}
