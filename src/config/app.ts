export const appConfig = {
  name: 'WellNest',
  shortName: 'WellNest',
  websiteUrl: 'https://wellnest-healthcare.vercel.app',
  tagline: 'Your health. Connected for life.',
  description:
    'WellNest is a secure digital health ecosystem where patients, doctors, hospitals, laboratories, pharmacies, and insurance providers manage verified medical records throughout a person\u2019s lifetime.',
  supportPath: '/support',
} as const;

export type AppConfig = typeof appConfig;
