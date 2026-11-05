import { Seo } from '../components/seo/Seo';
import { PremiumLanding } from './landing/PremiumLanding';

export default function HomePage() {
  return (
    <>
      <Seo
        title="Your health, all together"
        description="A little less paperwork. A lot more peace of mind. Bring your medical records, care teams, and health journey together with WellNest."
      />
      <PremiumLanding />
    </>
  );
}
