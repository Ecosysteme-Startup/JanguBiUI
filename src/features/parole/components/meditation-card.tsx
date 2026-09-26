import { Avatar } from '@/components/ui/avatar';
import type { LiturgyDay } from '@/features/parole/api/get-liturgy-day';
import { frenchTypo } from '@/utils/french-typo';

type Meditation = NonNullable<LiturgyDay['meditation']>;

/** Méditation du jour (EF-PAR-05) : publiée pour la paroisse suivie ou ses ancêtres. */
export const MeditationCard = ({ meditation }: { meditation: Meditation }) => (
  <section aria-labelledby="meditation-titre" className="rounded border border-line bg-surface p-6">
    <h2 id="meditation-titre" className="tnum m-0 text-meta font-normal text-ink-3">
      Méditation du jour
    </h2>
    <p className="m-0 mt-4 font-serif text-h3 text-ink">{frenchTypo(meditation.title)}</p>
    {meditation.excerpt && <p className="m-0 mt-3 text-body text-ink">{frenchTypo(meditation.excerpt)}</p>}
    <div className="mt-6 flex items-center gap-3 border-t border-line pt-4">
      <Avatar name={meditation.author_name} size={40} />
      <div>
        <p className="m-0 text-base font-semibold text-ink">{meditation.author_name}</p>
        {meditation.scope && <p className="m-0 mt-0.5 text-sm text-ink-2">{meditation.scope}</p>}
      </div>
    </div>
  </section>
);
