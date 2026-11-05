import { Seo } from '../../components/seo/Seo';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { paths } from '../../routes/paths';

export default function UnauthorizedPage() {
  return (
    <>
      <Seo title="Sign in required" description="You need an active WellNest session to continue." />
      <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-600">401</p>
        <h1 className="mt-4 max-w-xl font-display text-4xl text-ink-900">This workspace is locked.</h1>
        <p className="mt-4 max-w-md text-ink-500">Sign in with the account that belongs to this role. We did not open any clinical data.</p>
        <img src="/images/illustration-security.png" alt="" className="my-8 h-36 w-36 object-contain" />
        <div className="flex flex-wrap justify-center gap-3">
          <Button to={paths.login}>Sign in</Button>
          <Button to={paths.register} variant="outline">
            Create account
          </Button>
        </div>
      </Container>
    </>
  );
}
