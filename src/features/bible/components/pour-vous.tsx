'use client';

import { Bookmark, Share2 } from 'lucide-react';
import * as React from 'react';

import { Link } from '@/components/ui/link/link';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { Reveal } from '@/lib/motion/reveal';
import { cn } from '@/utils/cn';

import { useCreerSignet } from '../api/create-signet';
import { type PourVous, usePourVous } from '../api/get-pour-vous';
import { lienBible } from '../utils/liens';
import { definirSignauxActifs } from '../utils/signaux-lecture';

import { PourquoiSuggestions } from './pourquoi-suggestions';

// « Pour vous aujourd'hui » (maquette WEB-FID-Parole-Pour-Vous, contrat
// API-PAROLE-POUR-VOUS §5) : un verset et sa raison, la lecture à continuer,
// un livre suggéré. Jamais de score ; une raison courte par suggestion.

const CLE_MASQUES = 'jb_parole_livres_masques';

const lireMasques = (): number[] => {
  try {
    return JSON.parse(localStorage.getItem(CLE_MASQUES) ?? '[]') as number[];
  } catch {
    return [];
  }
};

const boutonContour =
  'inline-flex h-9 items-center rounded-[10px] border border-border px-3.5 text-sm font-semibold text-foreground transition-colors hover:border-muted-foreground/60 hover:bg-muted/60';
const boutonIcone =
  'inline-flex size-9 items-center justify-center rounded-[10px] text-foreground/80 transition-colors hover:bg-muted disabled:opacity-50';

function Etiquette({ titre, raison }: { titre: string; raison?: string }) {
  return (
    <p className="text-[13px] leading-[18px] text-muted-foreground">
      <span className="font-semibold text-primary">{titre}</span>
      {raison && ` · ${raison}`}
    </p>
  );
}

function Separateur() {
  return <div aria-hidden="true" className="my-5 h-px bg-border" />;
}

function Verset({ verset }: { verset: NonNullable<PourVous['verset']> }) {
  const { addNotification } = useNotifications();
  const { mutate: creerSignet, isPending, isSuccess } = useCreerSignet();

  const partager = async () => {
    const texte = `« ${verset.texte} » (${verset.reference})`;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ text: texte });
        return;
      }
      await navigator.clipboard.writeText(texte);
      addNotification({ type: 'success', title: 'Verset copié' });
    } catch {
      // partage annulé
    }
  };

  return (
    <div>
      <Etiquette titre="Verset" raison={verset.raisons[0]} />
      <blockquote className="mt-2 font-serif text-lg leading-7 text-foreground">
        «&nbsp;{verset.texte}&nbsp;»
      </blockquote>
      <div className="mt-2 flex items-center gap-1">
        <Link
          href={lienBible({
            livreId: verset.livre.id,
            chapitre: verset.chapitre,
            verset: verset.numero,
          })}
          className="flex-1 text-sm font-semibold tabular-nums text-primary hover:underline"
        >
          {verset.reference}
        </Link>
        <button
          type="button"
          className={boutonIcone}
          aria-label={isSuccess ? 'Signet ajouté' : 'Ajouter un signet'}
          aria-pressed={isSuccess}
          disabled={isPending || isSuccess}
          onClick={() =>
            creerSignet(
              { verset_id: verset.id },
              {
                onSuccess: () =>
                  addNotification({ type: 'success', title: 'Signet ajouté' }),
                onError: () =>
                  addNotification({
                    type: 'error',
                    title: "Le signet n'a pas pu être ajouté",
                  }),
              },
            )
          }
        >
          <Bookmark
            className={cn('size-[18px]', isSuccess && 'fill-current')}
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          className={boutonIcone}
          aria-label="Partager le verset"
          onClick={() => void partager()}
        >
          <Share2 className="size-[18px]" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function PourVousAujourdhui({ className }: { className?: string }) {
  const { data } = usePourVous();
  const [pourquoi, setPourquoi] = React.useState(false);
  const [masques, setMasques] = React.useState<number[]>([]);

  React.useEffect(() => setMasques(lireMasques()), []);
  React.useEffect(() => {
    if (data) definirSignauxActifs(data.personnalisation_parole);
  }, [data]);

  // Suggestions désactivées : le bloc disparaît (spec C3 §5). Sans verset ni
  // lecture en cours : rien à proposer.
  if (!data || !data.personnalisation_parole) return null;
  const livre =
    data.livre_suggere && !masques.includes(data.livre_suggere.id)
      ? data.livre_suggere
      : null;
  const suite = data.lecture_a_continuer;
  if (!data.verset && !suite && !livre) return null;

  const masquerLivre = (id: number) => {
    const liste = Array.from(new Set([...masques, id]));
    setMasques(liste);
    try {
      localStorage.setItem(CLE_MASQUES, JSON.stringify(liste));
    } catch {
      // préférence locale seulement
    }
  };

  const blocs: React.ReactNode[] = [];
  if (data.verset) blocs.push(<Verset key="verset" verset={data.verset} />);
  if (suite) {
    blocs.push(
      <div key="suite">
        <Etiquette titre="À continuer" />
        <p className="mt-1 text-base font-semibold leading-[22px] text-foreground">
          Continuer {suite.reference}
        </p>
        <p className="mt-0.5 text-sm text-foreground/80">
          {suite.reprendre_au_verset
            ? `Au verset ${suite.reprendre_au_verset}`
            : 'Reprendre au début du chapitre'}
        </p>
        <div className="mt-3 flex justify-end">
          <Link
            href={lienBible({
              livreId: suite.livre.id,
              chapitre: suite.chapitre,
              verset: suite.reprendre_au_verset,
            })}
            className={boutonContour}
            aria-label={`Reprendre ${suite.reference}`}
          >
            Reprendre
          </Link>
        </div>
      </div>,
    );
  }
  if (livre) {
    blocs.push(
      <div key="livre">
        <Etiquette titre="Livre suggéré" raison={livre.raison} />
        <p className="mt-1 text-base font-semibold leading-[22px] text-foreground">
          {livre.nom}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Link
            href={lienBible({ livreId: livre.id, chapitre: 1 })}
            className={boutonContour}
            aria-label={`Commencer ${livre.nom}`}
          >
            Commencer
          </Link>
          <button
            type="button"
            onClick={() => masquerLivre(livre.id)}
            className="inline-flex h-9 items-center rounded-[10px] px-2.5 text-sm font-medium text-foreground/80 hover:bg-muted"
          >
            Ne plus proposer
          </button>
        </div>
      </div>,
    );
  }

  return (
    <Reveal appear className={className}>
      <section
        aria-labelledby="pv-titre"
        className="rounded-2xl border border-border bg-card p-6 shadow-soft-sm"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="pv-titre"
            className="font-sans text-lg font-semibold leading-[26px] tracking-normal text-foreground"
          >
            Pour vous aujourd&apos;hui
          </h2>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setPourquoi(true)}
            className="whitespace-nowrap text-sm font-medium text-primary hover:underline"
          >
            Pourquoi&nbsp;?
          </button>
        </div>
        <div className="mt-4">
          {blocs.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <Separateur />}
              {b}
            </React.Fragment>
          ))}
        </div>
        <p className="mt-5 border-t border-border pt-4 text-[13px] leading-[18px] text-muted-foreground">
          {data.personnalise
            ? 'Préparé chaque nuit à partir de vos lectures, visible uniquement par vous. '
            : 'Tiré des lectures du jour. '}
          <Link
            href={`${paths.app.profil.getHref()}#personnalisation`}
            className="font-medium text-primary hover:underline"
          >
            Réglages
          </Link>
        </p>
      </section>
      <PourquoiSuggestions
        ouvert={pourquoi}
        onOuvertChange={setPourquoi}
        exemple={livre?.raison ?? data.raisons[0] ?? null}
      />
    </Reveal>
  );
}
