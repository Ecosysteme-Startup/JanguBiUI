import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import type { LiturgyDay } from '@/features/parole/api/get-liturgy-day';
import { useMeditation } from '@/features/parole/api/get-meditation';
import { frenchTypo } from '@/utils/french-typo';

type MeditationRef = NonNullable<LiturgyDay['meditation']>;

/**
 * Méditation du jour (EF-PAR-05) : publiée pour la paroisse suivie ou ses ancêtres.
 * Le jour liturgique ne donne que le titre ; l'extrait et l'auteur viennent de l'article.
 */
export const MeditationCard = ({ meditation }: { meditation: MeditationRef }) => {
  const article = useMeditation(meditation.id);
  const scope = article.data?.scope?.node_name ?? meditation.scope;
  return (
    <section aria-labelledby="meditation-titre" className="rounded border border-line bg-surface p-6">
      <h2 id="meditation-titre" className="tnum m-0 text-meta font-normal text-ink-3">
        Méditation du jour
      </h2>
      <p className="m-0 mt-4 font-serif text-h3 text-ink">{frenchTypo(meditation.title)}</p>
      {article.isPending ? (
        <div className="mt-3 flex flex-col gap-2" aria-hidden="true">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : (
        article.data?.excerpt && <p className="m-0 mt-3 text-body text-ink">{frenchTypo(article.data.excerpt)}</p>
      )}
      {(article.data || scope) && (
        <div className="mt-6 flex items-center gap-3 border-t border-line pt-4">
          {article.data && <Avatar name={article.data.author_name} size={40} />}
          <div>
            {article.data && <p className="m-0 text-base font-semibold text-ink">{article.data.author_name}</p>}
            {scope && <p className="m-0 mt-0.5 text-sm text-ink-2">{scope}</p>}
          </div>
        </div>
      )}
    </section>
  );
};
