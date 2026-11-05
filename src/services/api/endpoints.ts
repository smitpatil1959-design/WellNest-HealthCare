export const endpoints = {
  health: '/api/health',
  contact: '/api/contact',
  waitlist: '/api/waitlist',
  session: '/api/session',
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    forgot: '/api/auth/forgot',
    reset: '/api/auth/reset',
    verify: '/api/auth/verify',
    otp: '/api/auth/otp',
  },
} as const;
