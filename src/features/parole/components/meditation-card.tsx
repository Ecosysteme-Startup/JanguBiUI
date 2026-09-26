import { Avatar } from '@/components/ui/avatar';
import type { LiturgyDay } from '@/features/parole/api/get-liturgy-day';
import { frenchTypo } from '@/utils/french-typo';

type Meditation = NonNullable<LiturgyDay['meditation']>;

/** « Pour méditer » (EF-PAR-05) : méditation publiée pour la paroisse suivie ou ses ancêtres. */
export const MeditationCard = ({ meditation }: { meditation: Meditation }) => (
  <section aria-labelledby="meditation-titre" className="mt-12">
    <h2 id="meditation-titre" className="m-0 text-20 font-semibold text-ink">
      Pour méditer
    </h2>
    <div className="mt-4 rounded-16 border border-line bg-surface p-6">
      <div className="flex items-center gap-3">
        <Avatar name={meditation.author_name} size={40} />
        <div className="min-w-0">
          <p className="m-0 text-15 font-semibold text-ink">{meditation.author_name}</p>
          {meditation.scope && <p className="m-0 text-13 text-ink-3">{meditation.scope}</p>}
        </div>
      </div>
      <p className="m-0 mt-4 text-16 font-semibold text-ink">{frenchTypo(meditation.title)}</p>
      {meditation.excerpt && <p className="m-0 mt-2 text-16 leading-[1.625] text-ink">{frenchTypo(meditation.excerpt)}</p>}
    </div>
  </section>
);
