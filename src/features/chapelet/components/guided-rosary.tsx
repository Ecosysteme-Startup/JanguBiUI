'use client';

import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import type { Prayer, RosaryToday } from '@/features/chapelet/api/get-rosary-today';
import { DecadeBeads } from '@/features/chapelet/components/decade-beads';
import { MysteryList } from '@/features/chapelet/components/mystery-list';
import { isAtStart, progressReducer, START } from '@/features/chapelet/utils/progress';
import { beadsOf, decadeOf, mysteryTitle, ordinal, prayerName, remainingMinutes, WEEKDAYS } from '@/features/chapelet/utils/rosary';
import { cn } from '@/utils/cn';
import { frenchTypo } from '@/utils/french-typo';

const TYPING = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A']);

const PrayerAside = ({ id, when, status, prayer }: { id: string; when: string; status: string; prayer: Prayer }) => (
  <section aria-labelledby={id} className="border-t border-line-strong pt-3">
    <p className="tnum m-0 flex justify-between text-meta text-ink-2">
      <span>{when}</span>
      <span className="text-ink-3">{status}</span>
    </p>
    <h3 id={id} className="m-0 mt-3 font-serif text-h4 font-normal text-ink">
      {prayerName(prayer.type)}
    </h3>
    <p className="m-0 mt-2 whitespace-pre-line font-serif text-base text-ink-2">{frenchTypo(prayer.text)}</p>
  </section>
);

/** Prière guidée, grain par grain (FID-Chapelet). Rien n'est enregistré côté serveur. */
export const GuidedRosary = ({ rosary }: { rosary: RosaryToday }) => {
  const { group, weekday } = rosary.day;
  const mysteries = useMemo(() => [...group.mysteries].sort((a, b) => a.order - b.order), [group.mysteries]);
  const decades = useMemo(() => mysteries.map((m) => decadeOf(m, rosary.standalone_prayers)), [mysteries, rosary.standalone_prayers]);
  const reducer = useMemo(() => progressReducer(decades.map((d) => d.length)), [decades]);
  const [progress, dispatch] = useReducer(reducer, START);
  const [intention, setIntention] = useState('');

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

  const groupName = group.name.toLowerCase();
  const mystery = mysteries[progress.mystery];
  const beads = beadsOf(decades[progress.mystery] ?? []);
  const bead = beads[progress.step];
  const hailMaryTotal = beads.filter((b) => b.hailMary !== null).length;
  const hailMaryDone = beads.slice(0, progress.step + 1).filter((b) => b.hailMary !== null).length;
  const ourFatherIndex = beads.findIndex((b) => b.prayer.type === 'OUR_FATHER');
  const gloryIndex = beads.findIndex((b) => b.prayer.type === 'GLORY_BE');
  const statusOf = (i: number) => (i < progress.step ? 'dite' : i === progress.step ? 'en cours' : 'à venir');
  const isLast = progress.mystery === mysteries.length - 1 && progress.step === beads.length - 1;
  const closing = rosary.standalone_prayers.find((p) => p.type === 'HOLY_QUEEN');
  const opening = rosary.standalone_prayers.filter((p) => p.type === 'SIGN_OF_CROSS' || p.type === 'CREED');

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="tnum m-0 text-meta text-ink-2">
            <span className="text-primary">01</span> — Chapelet guidé · le {WEEKDAYS[weekday] ?? ''}
          </p>
          <h1 className="m-0 mt-3 font-serif text-[36px] font-normal leading-none tracking-[-0.015em] text-ink lg:text-[50px]">
            Les mystères <em className="italic text-primary">{groupName}</em>
          </h1>
        </div>
        <p className="tnum m-0 flex flex-col text-meta text-ink-2 lg:items-end" aria-live="polite">
          {progress.done ? (
            <span className="text-base text-ink">Chapelet achevé</span>
          ) : (
            <>
              <span className="text-base text-ink">
                Mystère {progress.mystery + 1} sur {mysteries.length}
              </span>
              <span>Environ {remainingMinutes(rosary, progress.mystery, progress.step)} minutes restantes</span>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-6">
        <div className="flex flex-col gap-8 lg:col-span-3">
          <MysteryList mysteries={mysteries} current={progress.mystery} done={progress.done} onJump={(i) => dispatch({ type: 'jump', mystery: i })} />
          <Field id="chapelet-intention" label="Mon intention" hint="Visible de vous seule. Elle n’est pas enregistrée.">
            <Textarea rows={3} value={intention} onChange={(e) => setIntention(e.target.value)} />
          </Field>
        </div>

        {progress.done ? (
          <section aria-labelledby="chapelet-fin" className="lg:col-span-6">
            <h2 id="chapelet-fin" className="m-0 font-serif text-h2 font-normal text-ink">
              Vous avez prié les mystères {groupName}.
            </h2>
            {intention.trim() && <p className="m-0 mt-4 font-serif text-lead italic text-ink-2">« {intention.trim()} »</p>}
            {closing && (
              <>
                <p className="tnum m-0 mt-8 text-meta text-ink-2">Pour conclure · {prayerName(closing.type)}</p>
                <p className="m-0 mt-3 max-w-reading whitespace-pre-line font-serif text-lead text-ink">{frenchTypo(closing.text)}</p>
              </>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => dispatch({ type: 'restart' })}>Recommencer</Button>
              <Button variant="secondary" onClick={() => dispatch({ type: 'prev' })}>
                Revenir au dernier grain
              </Button>
            </div>
          </section>
        ) : (
          mystery && (
            <section aria-labelledby="chapelet-mystere" className="lg:col-span-6">
              <p className="tnum m-0 text-meta text-ink-2">
                {ordinal(progress.mystery + 1)} mystère {groupName}
                {mystery.meditation_source && ` · ${mystery.meditation_source}`}
              </p>
              <h2 id="chapelet-mystere" className="m-0 mt-3 font-serif text-h2 font-normal text-ink">
                {mysteryTitle(mystery)}
              </h2>
              {mystery.meditation && <p className="m-0 mt-4 max-w-reading font-serif text-lead text-ink-2">{frenchTypo(mystery.meditation)}</p>}

              {beads.length === 0 ? (
                <p className="m-0 mt-8 text-base text-ink-3">Les prières de ce mystère ne sont pas encore disponibles.</p>
              ) : (
                <>
                  <p className="tnum m-0 mt-8 flex justify-between border-t border-line-strong pt-3 text-meta text-ink-2">
                    <span>Dizaine</span>
                    <span>
                      {hailMaryDone} / {hailMaryTotal}
                    </span>
                  </p>
                  <div className="mt-4">
                    <DecadeBeads beads={beads} step={progress.step} />
                  </div>
                  {bead && (
                    <div className="mt-8 rounded border border-line bg-surface p-6">
                      <p className="tnum m-0 flex justify-between text-meta text-ink-2" aria-live="polite">
                        <span>Prière en cours</span>
                        <span className="text-ink">
                          {prayerName(bead.prayer.type)}
                          {bead.hailMary !== null && ` · ${bead.hailMary}e`}
                        </span>
                      </p>
                      <p className="m-0 mt-4 whitespace-pre-line font-serif text-lead leading-[1.7] text-ink">{frenchTypo(bead.prayer.text)}</p>
                    </div>
                  )}
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button onClick={next}>{isLast ? 'Terminer le chapelet' : 'Grain suivant'}</Button>
                    <Button variant="secondary" disabled={isAtStart(progress)} onClick={() => dispatch({ type: 'prev' })}>
                      Grain précédent
                    </Button>
                    <span className="tnum hidden text-meta text-ink-3 lg:inline">Touche espace : grain suivant</span>
                  </div>
                </>
              )}
            </section>
          )
        )}

        <aside aria-label="Prières de la dizaine" className={cn('flex flex-col gap-8 lg:col-span-3')}>
          {!progress.done && ourFatherIndex >= 0 && (
            <PrayerAside id="chapelet-np" when="Avant la dizaine" status={statusOf(ourFatherIndex)} prayer={beads[ourFatherIndex].prayer} />
          )}
          {!progress.done && gloryIndex >= 0 && (
            <PrayerAside id="chapelet-gloire" when="Après la dizaine" status={statusOf(gloryIndex)} prayer={beads[gloryIndex].prayer} />
          )}
          {opening.length > 0 && (
            <details className="border-t border-line-strong pt-3">
              <summary className="tnum flex min-h-11 cursor-pointer items-center text-meta text-ink-2">Prières d’ouverture</summary>
              {opening.map((p) => (
                <div key={p.id} className="mt-3">
                  <p className="m-0 font-serif text-h4 text-ink">{prayerName(p.type)}</p>
                  <p className="m-0 mt-2 whitespace-pre-line font-serif text-base text-ink-2">{frenchTypo(p.text)}</p>
                </div>
              ))}
            </details>
          )}
        </aside>
      </div>
    </>
  );
};
