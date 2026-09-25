import NextLink from 'next/link';

import { Icon, type IconName } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import type { LiturgyDay } from '@/features/parole/api/get-liturgy-day';
import { MeditationCard } from '@/features/parole/components/meditation-card';
import { readingAnchor, readingNumber } from '@/features/parole/components/reading-section';
import { ShareReadings } from '@/features/parole/components/share-readings';
import { readingChapter, readingLabel, rosaryOfDay } from '@/features/parole/utils/liturgy';

const PrayerLink = ({ href, icon, title, hint }: { href: string; icon: IconName; title: string; hint: string }) => (
  <NextLink href={href} className="flex items-center gap-3 border-b border-line py-4 text-ink transition-colors hover:bg-surface-2">
    <Icon name={icon} size={20} className="shrink-0" />
    <span className="flex-1">
      <span className="block text-base font-semibold">{title}</span>
      <span className="mt-0.5 block text-sm text-ink-2">{hint}</span>
    </span>
    <Icon name="chevron-droite" size={16} className="text-ink-3" />
  </NextLink>
);

/** Colonne d'appui : sommaire, méditation, prolonger la prière, partage. */
export const ReadingsAside = ({ day }: { day: LiturgyDay }) => {
  const first = day.readings.map(readingChapter).find(Boolean) ?? null;
  const rosary = rosaryOfDay(day.date);
  return (
    <aside aria-label="Autour des lectures" className="flex flex-col gap-10 lg:col-span-4">
      {day.readings.length > 0 && (
        <nav aria-labelledby="sommaire-titre" className="hidden lg:block">
          <h2 id="sommaire-titre" className="tnum m-0 border-t border-line-strong pt-3 text-meta font-normal text-ink-2">
            Dans ces lectures
          </h2>
          <ol className="m-0 mt-2 list-none p-0">
            {day.readings.map((r, i) => (
              <li key={`${r.type}-${i}`}>
                <a
                  href={`#${readingAnchor(i)}`}
                  className="flex h-12 items-center justify-between border-b border-line text-base text-ink transition-colors hover:text-primary"
                >
                  <span>
                    <span className="tnum text-meta text-primary">{readingNumber(i)}</span>
                    {'  '}
                    {readingLabel(r.type)}
                  </span>
                  <span className="tnum text-xs text-ink-3">{r.citation}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      {day.meditation && <MeditationCard meditation={day.meditation} />}

      <section aria-labelledby="prier-titre">
        <h2 id="prier-titre" className="tnum m-0 border-t border-line-strong pt-3 text-meta font-normal text-ink-2">
          Prolonger la prière
        </h2>
        {first && (
          <PrayerLink
            href={paths.app.bible.chapitre.getHref(first.book, first.chapter)}
            icon="bible"
            title={`Ouvrir ${first.book}, chapitre ${first.chapter}`}
            hint="Dans la Bible, le chapitre entier"
          />
        )}
        <PrayerLink
          href={paths.app.chapelet.getHref()}
          icon="chapelet"
          title={`Chapelet du ${rosary.weekday}`}
          hint={`Mystères ${rosary.group}, prière guidée pas à pas`}
        />
      </section>

      <ShareReadings date={day.date} />
    </aside>
  );
};
