import { Quote } from 'lucide-react';
import { Container, Section } from '../../components/ui/Container';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { Avatar } from '../../components/ui/Avatar';
import { testimonials } from '../../constants/content';

export function Testimonials() {
  return (
    <Section id="testimonials">
      <Container>
        <SectionHeading
          eyebrow="Voices"
          title="Calm software for serious work."
          description="Composite stories from design partners. Production quotes will replace these as contracts close."
          align="center"
        />
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {testimonials.map((item) => (
            <figure key={item.name} className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <Quote className="h-6 w-6 text-brand-200" />
              <blockquote className="mt-4 flex-1 text-[15px] leading-7 text-ink-700">“{item.quote}”</blockquote>
              <figcaption className="mt-8 flex items-center gap-3 border-t border-line pt-5">
                <Avatar name={item.name} src={item.image} />
                <div>
                  <p className="text-sm font-semibold text-ink-900">{item.name}</p>
                  <p className="text-xs text-ink-500">
                    {item.role}, {item.organization}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </Section>
  );
}
