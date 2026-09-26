'use client';

import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Textarea } from '@/components/ui/textarea';
import { DaysTable } from '@/features/chapelet/components/days-table';
import { DecadeBeads } from '@/features/chapelet/components/decade-beads';
import { MysteryList } from '@/features/chapelet/components/mystery-list';
import { isAtStart, progressReducer, START } from '@/features/chapelet/utils/progress';
import { beadsOf, decadeOf, fruitLabel, mysteryHeading, mysteryTitle } from '@/features/chapelet/utils/rosary';
import { browserStorage, loadProgress, progressKey, saveProgress } from '@/features/chapelet/utils/saved-progress';
import type { RosaryToday } from '@/hooks/use-rosary-today';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

const TYPING = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A']);

/**
 * Prière guidée, grain par grain (FID-Chapelet). Rien n'est envoyé au serveur ; l'avancée est gardée
 * dans ce navigateur jusqu'au soir (clé du jour et des mystères).
 */
export const GuidedRosary = ({ rosary, today }: { rosary: RosaryToday; today: number }) => {
  const { group } = rosary.day;
  const mysteries = useMemo(() => [...group.mysteries].sort((a, b) => a.order - b.order), [group.mysteries]);
  const decades = useMemo(() => mysteries.map((m) => decadeOf(m, rosary.standalone_prayers)), [mysteries, rosary.standalone_prayers]);
  const lengths = useMemo(() => decades.map((d) => d.length), [decades]);
  const reducer = useMemo(() => progressReducer(lengths), [lengths]);
  const key = progressKey(dayjs().format('YYYY-MM-DD'), group.slug);
  const [progress, dispatch] = useReducer(reducer, START, () => loadProgress(browserStorage(), key, lengths) ?? START);
  const [intention, setIntention] = useState('');

  useEffect(() => saveProgress(browserStorage(), key, progress), [key, progress]);

  const next = useCallback(() => dispatch({ type: 'next' }), []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key !== ' ' || (target && (TYPING.has(target.tagName) || target.isContentEditable))) return;
      event.preventDefault();
      next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next]);

  const groupName = group.name.replace(/^myst[èe]res\s+/i, '').toLowerCase();
  const mystery = mysteries[progress.mystery];
  const beads = beadsOf(decades[progress.mystery] ?? []);
  const bead = beads[progress.step];
  const isLast = progress.mystery === mysteries.length - 1 && progress.step === beads.length - 1;
  const closing = rosary.standalone_prayers.find((p) => p.type === 'HOLY_QUEEN');
  const opening = rosary.standalone_prayers.filter((p) => p.type === 'SIGN_OF_CROSS' || p.type === 'CREED');
  const fruit = fruitLabel(mystery ?? mysteries[0]);

  return (
    <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_336px] xl:items-start">
      {progress.done ? (
        <section aria-labelledby="chapelet-fin" className="rounded-16 border border-line bg-paper p-6 shadow-card sm:p-8">
          <h2 id="chapelet-fin" className="m-0 text-24 font-semibold text-ink">
            Vous avez prié les mystères {groupName}.
          </h2>
          {intention.trim() && <p className="m-0 mt-4 font-serif text-18 italic text-ink-2">« {intention.trim()} »</p>}
          {closing && (
            <>
              <p className="m-0 mt-8 text-13 text-ink-3">Pour conclure · {closing.type_display}</p>
              <p className="m-0 mt-3 whitespace-pre-line font-serif text-20 leading-8 text-ink">{frenchTypo(closing.text)}</p>
            </>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => dispatch({ type: 'restart' })}>Recommencer</Button>
            <Button variant="outline" onClick={() => dispatch({ type: 'prev' })}>
              Revenir au dernier grain
            </Button>
          </div>
        </section>
      ) : (
        mystery && (
          <section aria-labelledby="chapelet-mystere" className="overflow-hidden rounded-16 border border-line bg-paper shadow-card">
            <div className="px-6 pb-6 pt-7 sm:px-8">
              <p className="m-0 flex flex-wrap items-center justify-between gap-x-4 text-14" aria-live="polite">
                <span className="font-semibold text-primary-strong">{mysteryHeading(progress.mystery + 1, group.name)}</span>
                <span className="tnum text-ink-3">
                  Dizaine {progress.mystery + 1} sur {mysteries.length}
                </span>
              </p>
              <h2 id="chapelet-mystere" className="m-0 mt-2 text-24 font-semibold text-ink">
                {mysteryTitle(mystery)}
              </h2>
              {(fruit || mystery.meditation_source) && (
                <p className="m-0 mt-1.5 text-15 text-ink-2">
                  {[fruit && `Fruit du mystère : ${fruit.replace(/^fruit : /, '')}`, mystery.meditation_source].filter(Boolean).join(' · ')}
                </p>
              )}
              {mystery.meditation && (
                <details className="mt-3">
                  <summary className="hit inline-flex cursor-pointer items-center text-14 font-semibold text-primary">Méditer ce mystère</summary>
                  <p className="m-0 mt-2 font-serif text-18 text-ink-2">{frenchTypo(mystery.meditation)}</p>
                </details>
              )}
              {beads.length > 0 && <DecadeBeads beads={beads} step={progress.step} />}
            </div>

            <div className="border-t border-line bg-surface px-6 pb-8 pt-7 sm:px-8">
              {beads.length === 0 || !bead ? (
                <p className="m-0 text-16 text-ink-3">Les prières de ce mystère ne sont pas encore disponibles.</p>
              ) : (
                <>
                  <p className="m-0 text-13 text-ink-3">Prière en cours</p>
                  <p className="m-0 mt-0.5 text-17 font-semibold text-ink" aria-live="polite">
                    {bead.prayer.type_display}
                    {bead.hailMary !== null && <span className="sr-only"> · {bead.hailMary}e</span>}
                  </p>
                  <p className="m-0 mt-4 whitespace-pre-line font-serif text-22 leading-9 text-ink">{frenchTypo(bead.prayer.text)}</p>
                </>
              )}
              <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-[200px_minmax(0,1fr)]">
                <Button variant="outline" size="xl" disabled={isAtStart(progress)} onClick={() => dispatch({ type: 'prev' })}>
                  <Icon name="chevron-gauche" size={18} />
                  Précédent
                </Button>
                <Button size="xl" onClick={next}>
                  {isLast ? 'Terminer le chapelet' : 'Suivant'}
                  <Icon name="chevron-droite" size={18} />
                </Button>
              </div>
              <p className="m-0 mt-3 hidden text-right text-13 text-ink-3 lg:block">Astuce : la barre d’espace passe au grain suivant.</p>
            </div>
          </section>
        )
      )}

      <div className="flex min-w-0 flex-col gap-6">
        <MysteryList
          group={groupName}
          mysteries={mysteries}
          current={progress.mystery}
          done={progress.done}
          onJump={(i) => dispatch({ type: 'jump', mystery: i })}
        />
        <DaysTable today={today} praying={group.name.replace(/^myst[èe]res\s+/i, '')} />
        <Field id="chapelet-intention" label="Mon intention" hint="Visible de vous seule. Elle n’est pas enregistrée.">
          <Textarea rows={3} value={intention} onChange={(e) => setIntention(e.target.value)} />
        </Field>
        {opening.length > 0 && (
          <details className="rounded-16 border border-line p-4">
            <summary className="flex min-h-11 cursor-pointer items-center text-15 font-semibold text-ink">Prières d’ouverture</summary>
            {opening.map((p) => (
              <div key={p.id} className="mt-3">
                <p className="m-0 text-15 font-semibold text-ink">{p.type_display}</p>
                <p className="m-0 mt-1 whitespace-pre-line font-serif text-16 text-ink-2">{frenchTypo(p.text)}</p>
              </div>
            ))}
          </details>
        )}
        <Button variant="outline" className="min-h-11" onClick={() => dispatch({ type: 'restart' })}>
          <Icon name="rafraichir" size={18} />
          Recommencer le chapelet
        </Button>
      </div>
    </div>
  );
};
