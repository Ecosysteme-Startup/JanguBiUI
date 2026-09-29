import { Circle } from 'lucide-react';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

import type { EncodingStep, StaffTrack } from '../../types/schemas';
import { formatDuree } from '../../utils/format';

type EtatEtape = 'fait' | 'en_cours' | 'a_venir' | 'echec';

/**
 * Qualités produites pendant l'étape `qualites` : l'avancement passe par
 * 30, 41, 52 puis 63 % au début de chaque encodage (contrat B3b §2).
 */
const QUALITES = [
  { libelle: 'bas 32 kb/s', debut: 30 },
  { libelle: 'moyen 64 kb/s', debut: 41 },
  { libelle: 'haut 128 kb/s', debut: 52 },
];

function detailQualites(t: StaffTrack | undefined, etat: EtatEtape): string {
  if (etat !== 'en_cours' || t?.encoding_percent == null)
    return 'Bas 32 kb/s · moyen 64 kb/s · haut 128 kb/s';
  const pc = t.encoding_percent;
  const texte = QUALITES.map((q, i) => {
    const fin = QUALITES[i + 1]?.debut ?? 63;
    const etatQ = pc >= fin ? ' prêt' : pc >= q.debut ? ' en cours' : '';
    return `${q.libelle}${etatQ}`;
  }).join(' · ');
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

const ETAPES: {
  code: Exclude<EncodingStep, '' | 'termine'>;
  titre: string;
  detail: (t: StaffTrack | undefined, etat: EtatEtape) => string;
}[] = [
  {
    code: 'analyse',
    titre: 'Analyse du fichier',
    detail: (t) =>
      t?.duration_seconds
        ? `Durée ${formatDuree(t.duration_seconds)}`
        : 'Durée, format et étiquettes',
  },
  {
    code: 'normalisation',
    titre: 'Normalisation du volume',
    detail: () => 'Ramené à −16 LUFS',
  },
  { code: 'qualites', titre: 'Encodage en 3 qualités', detail: detailQualites },
  {
    code: 'forme_onde',
    titre: 'Forme d’onde et version hors ligne',
    detail: () => '200 points pour le lecteur, MP3 128 kb/s',
  },
];

/** Index de l'étape courante (0 à 3), 4 si terminé, -1 si pas commencé. */
export function indexEtape(step: EncodingStep | null | undefined): number {
  if (step === 'termine') return ETAPES.length;
  return ETAPES.findIndex((e) => e.code === step);
}

/** Libellé de l'étape en cours (tableau du staff), ou null. */
export function libelleEtape(
  step: EncodingStep | null | undefined,
): string | null {
  const i = indexEtape(step);
  return i >= 0 && i < ETAPES.length ? ETAPES[i].titre : null;
}

/**
 * Les 4 étapes de l'encodage (plan §5.2) et l'avancement réel, lus dans
 * `encoding_step` et `encoding_percent` (suivi `GET audio/uploads/<id>/`).
 * En échec, l'étape atteinte reste marquée.
 */
export function EtapesEncodage({
  track,
  termine,
}: {
  track?: StaffTrack;
  termine?: boolean;
}) {
  const statut = track?.status;
  const courant = indexEtape(track?.encoding_step);
  const etat = (i: number): EtatEtape => {
    if (termine || statut === 'pret') return 'fait';
    if (statut === 'echec') {
      const atteint = Math.max(courant, 0);
      return i < atteint ? 'fait' : i === atteint ? 'echec' : 'a_venir';
    }
    if (statut !== 'encodage' || courant < 0) return 'a_venir';
    return i < courant ? 'fait' : i === courant ? 'en_cours' : 'a_venir';
  };
  const enCours = statut === 'encodage' || statut === 'en_file';
  const pourcent = Math.round(track?.encoding_percent ?? 0);

  return (
    <div>
      {enCours && (
        <div
          role="progressbar"
          aria-label="Avancement de l’encodage"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pourcent}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2"
        >
          <div
            className="size-full origin-left rounded-full bg-primary-fill transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `scaleX(${pourcent / 100})` }}
          />
        </div>
      )}
      <ol className="mt-3 space-y-2" aria-label="Étapes de l’encodage">
        {ETAPES.map((e, i) => {
          const s = etat(i);
          return (
            <li
              key={e.code}
              data-etape={s}
              className="flex items-start gap-2.5 text-14"
            >
              <span
                className={cn(
                  'mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full',
                  s === 'fait' && 'bg-ok-bg text-ok',
                  s === 'en_cours' && 'bg-tint-50 text-primary',
                  s === 'echec' && 'bg-err-bg text-err',
                  s === 'a_venir' && 'bg-surface-2 text-ink-3',
                )}
                aria-hidden
              >
                {s === 'fait' ? (
                  <Icon name="check" className="size-3.5" />
                ) : s === 'en_cours' ? (
                  <Icon name="chargement" className="size-3.5 animate-spin motion-reduce:animate-none" />
                ) : s === 'echec' ? (
                  <Icon name="erreur" className="size-3.5" />
                ) : (
                  <Circle className="size-2.5" />
                )}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    'block font-medium',
                    s === 'a_venir' ? 'text-ink-3' : 'text-ink',
                  )}
                >
                  {e.titre}
                  <span className="sr-only">
                    {s === 'fait'
                      ? ' (terminé)'
                      : s === 'en_cours'
                        ? ' (en cours)'
                        : s === 'echec'
                          ? ' (interrompu)'
                          : ' (à venir)'}
                  </span>
                </span>
                <span className="block text-ink-3">{e.detail(track, s)}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
