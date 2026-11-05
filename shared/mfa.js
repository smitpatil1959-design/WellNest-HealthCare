// The caller must verify the token with Supabase Auth before consulting its claims.
export function requiresSecondFactor(user, claims) {
  const enrolled = (user?.factors || []).some(factor => factor.status === 'verified');
  return enrolled && (claims?.sub !== user.id || claims?.aal !== 'aal2');
}
