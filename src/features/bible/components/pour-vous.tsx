'use client';

import NextLink from 'next/link';
import * as React from 'react';

import { Icon } from '@/components/ui/icon';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { Reveal } from '@/lib/motion/reveal';
import { cn } from '@/utils/cn';

import { useCreerSignet } from '../api/create-signet';
import { type PourVous, usePourVous } from '../api/get-pour-vous';
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

/** Lien vers un chapitre de la Bible, au verset voulu (`#v12`). */
const lienBible = ({
  slug,
  chapitre,
  verset,
}: {
  slug: string;
  chapitre: number;
  verset?: number | null;
}) =>
  `${paths.app.bible.chapitre.getHref(slug, chapitre)}${verset ? `#v${verset}` : ''}`;

const boutonContour =
  'inline-flex h-9 items-center rounded-10 border border-line px-3.5 text-14 font-semibold text-ink transition-colors hover:border-line-strong hover:bg-surface-2';
const boutonIcone =
  'inline-flex size-9 items-center justify-center rounded-10 text-ink-2 transition-colors hover:bg-surface-2 disabled:opacity-50';

function Etiquette({ titre, raison }: { titre: string; raison?: string }) {
  return (
    <p className="text-13 leading-[18px] text-ink-3">
      <span className="font-semibold text-primary">{titre}</span>
      {raison && ` · ${raison}`}
    </p>
  );
}

function Separateur() {
  return <div aria-hidden="true" className="my-5 h-px bg-line" />;
}

function Verset({ verset }: { verset: NonNullable<PourVous['verset']> }) {
  const { mutate: creerSignet, isPending, isSuccess } = useCreerSignet();

  const partager = async () => {
    const texte = `« ${verset.texte} » (${verset.reference})`;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ text: texte });
        return;
      }
      await navigator.clipboard.writeText(texte);
      toast.ok('Verset copié.');
    } catch {
      // partage annulé
    }
  };

  return (
    <div>
      <Etiquette titre="Verset" raison={verset.raisons[0]} />
      <blockquote className="mt-2 text-18 leading-7 text-ink">
        «&nbsp;{verset.texte}&nbsp;»
      </blockquote>
      <div className="mt-2 flex items-center gap-1">
        <NextLink
          href={lienBible({
            slug: verset.livre.slug,
            chapitre: verset.chapitre,
            verset: verset.numero,
          })}
          className="flex-1 text-14 font-semibold tabular-nums text-primary hover:underline"
        >
          {verset.reference}
        </NextLink>
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
                onSuccess: () => toast.ok('Signet ajouté.'),
                onError: () => toast.err("Le signet n'a pas pu être ajouté."),
              },
            )
          }
        >
          <Icon name="signet"
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
          <Icon name="partager" className="size-[18px]" aria-hidden="true" />
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
        <p className="mt-1 text-15 font-semibold leading-[22px] text-ink">
          Continuer {suite.reference}
        </p>
        <p className="mt-0.5 text-14 text-ink-2">
          {suite.reprendre_au_verset
            ? `Au verset ${suite.reprendre_au_verset}`
            : 'Reprendre au début du chapitre'}
        </p>
        <div className="mt-3 flex justify-end">
          <NextLink
            href={lienBible({
              slug: suite.livre.slug,
              chapitre: suite.chapitre,
              verset: suite.reprendre_au_verset,
            })}
            className={boutonContour}
            aria-label={`Reprendre ${suite.reference}`}
          >
            Reprendre
          </NextLink>
        </div>
      </div>,
    );
  }
  if (livre) {
    blocs.push(
      <div key="livre">
        <Etiquette titre="Livre suggéré" raison={livre.raison} />
        <p className="mt-1 text-15 font-semibold leading-[22px] text-ink">
          {livre.nom}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <NextLink
            href={lienBible({ slug: livre.slug, chapitre: 1 })}
            className={boutonContour}
            aria-label={`Commencer ${livre.nom}`}
          >
            Commencer
          </NextLink>
          <button
            type="button"
            onClick={() => masquerLivre(livre.id)}
            className="inline-flex h-9 items-center rounded-10 px-2.5 text-14 font-medium text-ink-2 hover:bg-surface-2"
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
        className="rounded-16 border border-line bg-surface p-6 shadow-card"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="pv-titre"
            className="font-sans text-18 font-semibold leading-[26px] text-ink"
          >
            Pour vous aujourd&apos;hui
          </h2>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setPourquoi(true)}
            className="whitespace-nowrap text-14 font-medium text-primary hover:underline"
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
        <p className="mt-5 border-t border-line pt-4 text-13 leading-[18px] text-ink-3">
          {data.personnalise
            ? 'Préparé chaque nuit à partir de vos lectures, visible uniquement par vous. '
            : 'Tiré des lectures du jour. '}
          <NextLink
            href={`${paths.app.profil.getHref()}#personnalisation`}
            className="font-medium text-primary hover:underline"
          >
            Réglages
          </NextLink>
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
