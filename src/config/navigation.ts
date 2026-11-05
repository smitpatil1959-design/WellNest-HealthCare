import { paths } from '../routes/paths';

export const primaryNav = [
  { label: 'Home', href: paths.home },
  { label: 'About', href: paths.about },
  { label: 'Features', href: paths.features },
  { label: 'Contact', href: paths.contact },
] as const;

export const footerNav = {
  platform: [
    { label: 'Features', href: paths.features },
    { label: 'Security', href: `${paths.home}#security` },
    { label: 'How it works', href: `${paths.home}#how-it-works` },
  ],
  ecosystem: [
    { label: 'Patients', href: paths.roles.patient },
    { label: 'Doctors', href: paths.roles.doctor },
    { label: 'Hospitals', href: paths.roles.hospital },
    { label: 'Laboratories', href: paths.roles.laboratory },
    { label: 'Pharmacies', href: paths.roles.pharmacy },
    { label: 'Insurance', href: paths.roles.insurance },
  ],
  company: [
    { label: 'About WellNest', href: paths.about },
    { label: 'Contact', href: paths.contact },
  ],
} as const;
