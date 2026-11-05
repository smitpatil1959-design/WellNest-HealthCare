import { Seo } from '../components/seo/Seo';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { paths } from '../routes/paths';

export function NotFoundPage() {
  return (
    <>
      <Seo title="Page not found" description="The page you requested does not exist on WellNest." />
      <Container className="flex min-h-[64vh] flex-col items-center justify-center py-20 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-600">404</p>
        <h1 className="mt-4 max-w-xl text-balance font-display text-4xl text-ink-900 sm:text-5xl">
          This record is not on the timeline.
        </h1>
        <p className="mt-4 max-w-md text-ink-500">
          The page may have moved, or the link is incomplete. Return home or browse the platform features.
        </p>
        <div className="my-8 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-6 shadow-xs">
          <img src="/images/illustration-empty.png" alt="" className="h-40 w-40 object-contain" />
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button to={paths.home}>Back home</Button>
          <Button to={paths.features} variant="outline">
            Browse features
          </Button>
        </div>
      </Container>
    </>
  );
}

export default NotFoundPage;
