'use client';

import { BookOpen } from 'lucide-react';
import { useState } from 'react';

import { Link } from '@/components/ui/link/link';
import { paths } from '@/config/paths';
import { reportTrack, type ReportMotif } from '@/lib/player/api';
import { seasonLabel } from '@/lib/player/format';
import { usePlayerStore } from '@/lib/player/player-store';
import type { Track } from '@/lib/player/types';
import { cn } from '@/utils/cn';

/** Couleur liturgique du temps (pastille). */
const SEASON_COLORS: Record<string, string> = {
  ordinaire: '#2E6B3F',
  avent: '#5B3A8C',
  careme: '#5B3A8C',
  triduum: '#8C1F1F',
  noel: '#C9A227',
  paques: '#C9A227',
};

const MOTIFS: { value: ReportMotif; label: string }[] = [
  { value: 'droits', label: 'Droits d’auteur' },
  { value: 'inapproprie', label: 'Contenu inapproprié' },
  { value: 'qualite', label: 'Qualité du son' },
  { value: 'autre', label: 'Autre' },
];

function SubTitle({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between px-5 pb-1.5 pt-4">
      <h3 className="text-[13px] font-medium leading-[18px] text-muted-foreground">
        {children}
      </h3>
      {aside}
    </div>
  );
}

/** « Direction : Élisabeth Gomis » → [Direction, Élisabeth Gomis]. */
function performerRows(track: Track): [string, string][] {
  const rows: [string, string][] = [];
  if (track.source?.kind === 'chorale') rows.push(['Chœur', track.source.name]);
  for (const p of track.performers) {
    if (p === track.source?.name) continue;
    const m = p.match(/^([^:]{2,24})\s*:\s*(.+)$/);
    rows.push(m ? [m[1].trim(), m[2].trim()] : ['Interprète', p]);
  }
  return rows;
}

function formatRecordedOn(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const s = d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function ReportForm({
  trackId,
  onDone,
}: {
  trackId: string;
  onDone: () => void;
}) {
  const [motif, setMotif] = useState<ReportMotif>('droits');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  if (state === 'sent') {
    return (
      <p role="status" className="px-5 pb-5 text-[13px] text-muted-foreground">
        Merci. La paroisse va examiner votre signalement.
      </p>
    );
  }
  return (
    <form
      className="mx-5 mb-5 rounded-xl border border-border p-3"
      onSubmit={(e) => {
        e.preventDefault();
        setState('sending');
        reportTrack(trackId, motif)
          .then(() => setState('sent'))
          .catch(() => setState('idle'));
      }}
    >
      <fieldset>
        <legend className="mb-2 text-[13px] font-medium">
          Signaler un problème
        </legend>
        <div className="flex flex-col gap-1.5">
          {MOTIFS.map((m) => (
            <label key={m.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="motif"
                value={m.value}
                checked={motif === m.value}
                onChange={() => setMotif(m.value)}
                className="accent-primary"
              />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="h-8 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={state === 'sending'}
          className="h-8 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          Envoyer
        </button>
      </div>
    </form>
  );
}

/** Panneau « À propos de cette piste » (colonne du lecteur déployé). */
export function PlayerAbout({
  className,
  bare = false,
}: {
  className?: string;
  /** Panneau latéral : sans carte ni titre (l'onglet porte le titre). */
  bare?: boolean;
}) {
  const track = usePlayerStore((s) => s.current);
  const collapse = usePlayerStore((s) => s.collapse);
  const [reporting, setReporting] = useState(false);
  if (!track) return null;

  const performers = performerRows(track);
  const recorded = formatRecordedOn(track.album?.recorded_on);
  const season = seasonLabel(track.liturgical_season);
  const readings = track.readings ?? [];

  return (
    <section
      aria-label="À propos de cette piste"
      className={cn(
        !bare &&
          'overflow-hidden rounded-2xl border border-border bg-card shadow-soft-sm',
        className,
      )}
    >
      <div className={cn('px-5 pb-3 pt-[18px]', bare && 'sr-only')}>
        <h2 className="font-sans text-lg font-semibold leading-[26px] tracking-normal">
          À propos de cette piste
        </h2>
      </div>

      {performers.length > 0 && (
        <>
          <div className="px-5 pb-2">
            <h3 className="text-[13px] font-medium leading-[18px] text-muted-foreground">
              Interprètes
            </h3>
          </div>
          <dl className="grid grid-cols-[112px_minmax(0,1fr)] gap-x-3 gap-y-2 px-5 text-sm leading-5">
            {performers.map(([role, name], i) => (
              <div key={`${role}-${i}`} className="contents">
                <dt className="text-muted-foreground">{role}</dt>
                <dd>{name}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      {(track.composer || recorded || track.album) && (
        <>
          <SubTitle>Œuvre et enregistrement</SubTitle>
          <dl className="grid grid-cols-[112px_minmax(0,1fr)] gap-x-3 gap-y-2 px-5 text-sm leading-5">
            {track.composer && (
              <div className="contents">
                <dt className="text-muted-foreground">Composition</dt>
                <dd>{track.composer}</dd>
              </div>
            )}
            {track.album && (
              <div className="contents">
                <dt className="text-muted-foreground">Album</dt>
                <dd>{track.album.title}</dd>
              </div>
            )}
            {recorded && (
              <div className="contents">
                <dt className="text-muted-foreground">Date</dt>
                <dd className="tabular-nums">{recorded}</dd>
              </div>
            )}
          </dl>
        </>
      )}

      {season && (
        <>
          <SubTitle>Temps liturgique</SubTitle>
          <div className="flex items-center gap-2 px-5 text-sm leading-5">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{
                background:
                  SEASON_COLORS[track.liturgical_season ?? ''] ??
                  'currentColor',
              }}
            />
            <span>{season}</span>
          </div>
        </>
      )}

      {readings.length > 0 && (
        <>
          <SubTitle
            aside={
              <Link
                href={paths.app.spirituelLiturgie.getHref()}
                onClick={collapse}
                className="text-[13px] font-medium text-primary hover:underline"
              >
                Ouvrir la Parole
              </Link>
            }
          >
            Lectures de la messe
          </SubTitle>
          <ul className="flex flex-wrap gap-2 px-5">
            {readings.map((r) => (
              <li key={r}>
                <Link
                  href={paths.app.spirituelLiturgie.getHref()}
                  onClick={collapse}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-[13px] font-medium tabular-nums text-secondary-foreground hover:border-primary/50"
                >
                  <BookOpen className="size-3.5" aria-hidden />
                  {r}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {track.description && (
        <>
          <SubTitle>Description</SubTitle>
          <p className="px-5 text-sm leading-[21px]">{track.description}</p>
        </>
      )}

      <SubTitle>Droits</SubTitle>
      <p className="px-5 pb-5 text-[13px] leading-[19px] text-muted-foreground">
        {track.source?.name
          ? `Publié par ${track.source.name}, qui en détient les droits. `
          : ''}
        {!reporting && (
          <button
            type="button"
            onClick={() => setReporting(true)}
            className="font-medium text-destructive hover:underline"
          >
            Signaler
          </button>
        )}
      </p>
      {reporting && (
        <ReportForm trackId={track.id} onDone={() => setReporting(false)} />
      )}
    </section>
  );
}
