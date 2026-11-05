import { Seo } from '../components/seo/Seo';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { paths } from '../routes/paths';

export function ErrorPage({ message = 'An unexpected error occurred while rendering this view.' }: { message?: string }) {
  return (
    <>
      <Seo title="Something went wrong" description="WellNest encountered an unexpected error." />
      <Container className="flex min-h-[64vh] flex-col items-center justify-center py-20 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-600">Error</p>
        <h1 className="mt-4 max-w-xl text-balance font-display text-4xl text-ink-900">We could not complete that request.</h1>
        <p className="mt-4 max-w-md text-ink-500">
          The interface recovered safely. Try again, or return to the homepage. Clinical data was not involved.
        </p>
        <img src="/images/illustration-security.png" alt="" className="my-8 h-36 w-36 object-contain" />
        <Alert tone="error" title="Details" className="max-w-lg text-left">
          {message}
        </Alert>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={() => window.location.reload()}>Try again</Button>
          <Button to={paths.home} variant="outline">
            Go home
          </Button>
        </div>
      </Container>
    </>
  );
}

export default ErrorPage;
