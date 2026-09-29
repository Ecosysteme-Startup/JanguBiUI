'use client';

import { ArrowDownAZ, ArrowUpZA, Download, Info, Lock } from 'lucide-react';
import * as React from 'react';

import { StatusBadge } from '@/components/ui/status-badge';
import { ApiError } from '@/lib/api-client';

import {
  type AnalyseDiocese,
  type FiltresAnalyse,
  type Granularite,
  type LigneParoisse,
  type TypeFonds,
  useAnalyseDiocese,
} from '../api/get-analyse-dons';
import { telechargerCsv, versCsv } from '../utils/export-csv';
import {
  arrondiMillier,
  capitaliser,
  formatFcfa,
  formatHorodatage,
  formatJourMois,
  formatMois,
  formatNombre,
  formatPourcent,
  NBSP,
} from '../utils/format';
import { trierAlphabetique } from '../utils/ordre';
import {
  COULEUR_FONDS,
  LIBELLE_FONDS,
  ORDRE_FONDS,
  ordonnerParFonds,
} from '../utils/palette';
import { enPeriode } from '../utils/periode';

import { BarreFiltres } from './barre-filtres';
import { BarreDeFlux } from './graphiques/barre-de-flux';
import { Carte, CarteGraphique } from './graphiques/carte-graphique';
import { ChiffreTitre } from './graphiques/chiffre-titre';
import { ColonnesEmpilees } from './graphiques/colonnes-empilees';
import {
  EtatChargement,
  EtatErreur,
  EtatTendanceIndisponible,
} from './graphiques/etats-graphique';
import { Jauge } from './graphiques/jauge';
import {
  TableauRepartition,
  TableauSimple,
} from './graphiques/tableau-repartition';

const MOIS_COURANT = '2026-09';
const TIRET = '—';

const GRANULARITES: { valeur: Granularite; libelle: string }[] = [
  { valeur: 'mois', libelle: 'Mois' },
  { valeur: 'trimestre', libelle: 'Trimestre' },
  { valeur: 'annee', libelle: 'Année' },
];

/**
 * Règles d'agrégat au-dessus de la paroisse (décisions du 27/09) : montants
 * arrondis au millier — appliqué aussi côté client, par sûreté ; aucun
 * masquage « moins de 5 dons » ni règle de dominance. La quête impérée et les
 * comptes de trésorerie restent au franc près (rapprochement).
 */
export const arrondirAgregats = (data: AnalyseDiocese): AnalyseDiocese => ({
  ...data,
  collecte: {
    ...data.collecte,
    total: arrondiMillier(data.collecte.total),
    pour_curie: arrondiMillier(data.collecte.pour_curie),
  },
  par_fonds: data.par_fonds.map((f) => ({
    ...f,
    montant: arrondiMillier(f.montant),
  })),
  par_mois: data.par_mois.map((m) => ({
    ...m,
    total: arrondiMillier(m.total),
    valeurs: Object.fromEntries(
      Object.entries(m.valeurs).map(([k, v]) => [k, arrondiMillier(v ?? 0)]),
    ) as typeof m.valeurs,
  })),
  paroisses: data.paroisses.map((p) => ({
    ...p,
    collecte: p.collecte === null ? null : arrondiMillier(p.collecte),
  })),
});

const EVOLUTION: Record<NonNullable<LigneParoisse['evolution']>, string> = {
  stable: 'stable',
  hausse: 'en hausse',
  baisse: 'en baisse',
};

function Synthese({ data }: { data: AnalyseDiocese }) {
  const c = data.collecte;
  const fonds = ordonnerParFonds(data.par_fonds);
  const periode = enPeriode(data.periode);
  return (
    <section
      aria-labelledby="titre-synthese-dio"
      className="rounded-2xl border border-border bg-card px-6 py-5 shadow-soft-sm"
    >
      <h2 id="titre-synthese-dio" className="sr-only">
        Synthèse
      </h2>
      <ChiffreTitre
        libelle={`Collecté via Jàngu Bi ${periode}`}
        horodatage={`au ${formatHorodatage(data.arrete_au)}`}
        badge={
          data.periode.en_cours && (
            <StatusBadge
              tone="progress"
              label="Mois en cours · chiffres provisoires"
            />
          )
        }
        avant="Environ"
        valeur={formatNombre(c.total)}
        unite="FCFA"
      >
        <br />
        collectés dans l&apos;archidiocèse, dont{' '}
        <strong className="font-semibold text-foreground">
          {formatNombre(c.pour_curie)}
        </strong>{' '}
        destinés à la curie.{' '}
        <strong className="font-semibold text-foreground">
          {c.paroisses_actives} paroisse{c.paroisses_actives > 1 ? 's' : ''} sur{' '}
          {c.paroisses_engagees}
        </strong>{' '}
        engagées collecte{c.paroisses_actives > 1 ? 'nt' : ''}
        {c.paroisses_en_preparation > 0 &&
          ` ; ${c.paroisses_en_preparation} ${c.paroisses_en_preparation > 1 ? 'sont' : 'est'} en préparation`}
        .
      </ChiffreTitre>
      <BarreDeFlux
        className="mt-4"
        titre="Répartition par type de fonds"
        segments={fonds.map((f) => ({
          cle: f.type,
          libelle: LIBELLE_FONDS[f.type],
          valeur: f.montant,
          couleur: COULEUR_FONDS[f.type],
        }))}
      />
      <TableauRepartition
        className="mt-4"
        caption={`Collecté par type de fonds, ${data.periode.libelle}, montants arrondis au millier de FCFA`}
        entete={{ libelle: 'Type de fonds', valeur: 'Environ' }}
        barres={false}
        formatValeur={formatFcfa}
        lignes={fonds.map((f) => ({
          cle: f.type,
          libelle: f.libelle,
          valeur: f.montant,
          couleur: COULEUR_FONDS[f.type],
        }))}
        total={c.total}
      />
      <p className="mt-3 text-[13px] leading-[18px] text-muted-foreground">
        Mesure : montant donné, en ligne et quêtes en espèces validées. Arrondis
        au millier : la somme peut différer du total.
      </p>
    </section>
  );
}

function ParMois({ data }: { data: AnalyseDiocese }) {
  const mois = data.par_mois;
  const series = ORDRE_FONDS.filter((t) =>
    mois.some((m) => (m.valeurs[t] ?? 0) > 0),
  ).map((t) => ({
    cle: t,
    libelle: LIBELLE_FONDS[t],
    couleur: COULEUR_FONDS[t],
  }));
  const dernier = mois[mois.length - 1];
  return (
    <CarteGraphique
      titre="Collecté par mois"
      sousTitre={`Par type de fonds · en milliers${NBSP}de FCFA · mois calendaires`}
      graphique={
        mois.length < 3 ? (
          <EtatTendanceIndisponible
            premierePeriode={
              data.premier_mois ? formatMois(data.premier_mois) : null
            }
            resume={
              dernier && (
                <>
                  {capitaliser(formatMois(dernier.mois))} : environ{' '}
                  <strong className="font-semibold text-foreground">
                    {formatFcfa(dernier.total)}
                  </strong>
                </>
              )
            }
          />
        ) : (
          <ColonnesEmpilees
            resume={`Collecté par mois : ${mois.map((m) => `${formatMois(m.mois)} environ ${formatFcfa(m.total)}`).join(' ; ')}.`}
            diviseur={1000}
            series={series}
            periodes={mois.map((m) => ({
              cle: m.mois,
              libelle: formatMois(m.mois, true),
              titreInfobulle: capitaliser(formatMois(m.mois)),
              valeurs: m.valeurs,
            }))}
          />
        )
      }
      tableau={
        <TableauSimple
          caption="Collecté par mois et par type de fonds, montants arrondis au millier de FCFA"
          colonnes={[
            { libelle: 'Mois' },
            ...series.map((s) => ({
              libelle: s.libelle,
              alignement: 'droite' as const,
            })),
            { libelle: 'Total', alignement: 'droite' },
          ]}
          lignes={mois.map((m) => ({
            cle: m.mois,
            cellules: [
              capitaliser(formatMois(m.mois)),
              ...series.map((s) =>
                formatNombre(m.valeurs[s.cle as TypeFonds] ?? 0),
              ),
              formatNombre(m.total),
            ],
          }))}
        />
      }
      pied={
        <p>
          Chaque paroisse ne sera comparée qu&apos;à elle-même, sur ses trois
          mois comparables. Comparaison avec l&apos;an dernier disponible à
          partir de septembre 2027.
        </p>
      }
    />
  );
}

function Releve({ lignes }: { lignes: { libelle: string; valeur: string }[] }) {
  return (
    <dl className="mt-3">
      {lignes.map((l) => (
        <div
          key={l.libelle}
          className="flex h-10 items-center justify-between gap-3 border-t border-border text-sm"
        >
          <dt className="text-foreground">{l.libelle}</dt>
          <dd className="font-semibold tabular-nums text-foreground">
            {l.valeur}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function CompteMarchand({ data }: { data: AnalyseDiocese }) {
  const m = data.compte_marchand;
  return (
    <Carte
      titre="Compte marchand"
      sousTitre={`Trésorerie de l'économat, ${data.periode.libelle.replace(/\s\d{4}$/, '')}. Montants exacts, sans aucun don nominatif.`}
    >
      <Releve
        lignes={[
          { libelle: "Reçu de l'agrégateur", valeur: formatFcfa(m.recu) },
          { libelle: 'Frais de paiement', valeur: formatFcfa(-m.frais) },
          {
            libelle: 'Confirmé, non reversé',
            valeur: formatFcfa(m.confirme_non_reverse),
          },
          { libelle: 'Écarts ouverts', valeur: String(m.ecarts_ouverts) },
          {
            libelle: 'Délai moyen de reversement',
            valeur:
              m.delai_moyen_jours === null
                ? TIRET
                : `${m.delai_moyen_jours}${NBSP}jours`,
          },
        ]}
      />
      {m.dernier_reversement_le && (
        <p className="mt-2 text-[13px] text-muted-foreground">
          Dernier reversement de l&apos;agrégateur le{' '}
          {formatJourMois(m.dernier_reversement_le)}
        </p>
      )}
    </Carte>
  );
}

function CompteLiaison({ data }: { data: AnalyseDiocese }) {
  return (
    <Carte
      titre="Compte de liaison"
      sousTitre={`Soldes entre l'économat et les paroisses, au ${formatJourMois(data.arrete_au)}`}
    >
      <ul className="mt-3">
        {data.compte_liaison.map((l) => (
          <li key={l.libelle} className="border-t border-border py-3">
            <p className="text-sm text-foreground">{l.libelle}</p>
            <p className="text-xl font-semibold tabular-nums text-foreground">
              {formatFcfa(l.montant)}
            </p>
            <p className="text-[13px] text-muted-foreground">{l.detail}</p>
          </li>
        ))}
      </ul>
    </Carte>
  );
}

export function TableauParoisses({
  paroisses,
  periode,
}: {
  paroisses: LigneParoisse[];
  periode: string;
}) {
  const [inverse, setInverse] = React.useState(false);
  const tries = trierAlphabetique(paroisses, (p) => p.nom);
  const lignes = inverse ? tries.reverse() : tries;
  const Icone = inverse ? ArrowUpZA : ArrowDownAZ;
  return (
    <section
      aria-labelledby="titre-paroisses"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft-sm"
    >
      <div className="px-6 pb-3 pt-5">
        <h2
          id="titre-paroisses"
          className="font-sans text-xl font-semibold leading-7 tracking-normal"
        >
          Paroisses
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Paroisses engagées, par ordre alphabétique · {periode} · chaque
          évolution se lit par rapport à la paroisse elle-même
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Paroisses engagées de l&apos;archidiocèse, ordre alphabétique,{' '}
            {periode}, montants arrondis au millier de FCFA
          </caption>
          <thead className="bg-background-surface text-[13px] text-muted-foreground">
            <tr className="h-11 border-y border-border">
              <th
                scope="col"
                aria-sort={inverse ? 'descending' : 'ascending'}
                className="pl-6 text-left font-medium"
              >
                <button
                  type="button"
                  onClick={() => setInverse((v) => !v)}
                  className="inline-flex items-center gap-1 font-semibold text-foreground"
                >
                  Paroisse
                  <Icone className="size-3.5 text-primary" aria-hidden="true" />
                  <span className="sr-only">
                    {inverse
                      ? '(de Z à A, cliquer pour A à Z)'
                      : '(de A à Z, cliquer pour Z à A)'}
                  </span>
                </button>
              </th>
              <th scope="col" className="text-left font-medium">
                Collecte
              </th>
              <th scope="col" className="pr-4 text-right font-medium">
                Collecté, environ
              </th>
              <th scope="col" className="pr-4 text-right font-medium">
                Part en ligne
              </th>
              <th scope="col" className="pr-4 text-right font-medium">
                Quêtes à valider
              </th>
              <th scope="col" className="pr-6 text-left font-medium">
                Évolution
              </th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((p) => (
              <tr
                key={p.id}
                data-paroisse={p.nom}
                className="h-14 border-b border-border"
              >
                <th scope="row" className="py-2 pl-6 text-left font-normal">
                  <span className="block font-semibold text-foreground">
                    {p.nom}
                  </span>
                  <span className="block text-[13px] text-muted-foreground">
                    {p.doyenne}
                    {p.note && ` · ${p.note}`}
                  </span>
                </th>
                <td>
                  {p.statut === 'collecte_ouverte' ? (
                    <StatusBadge tone="success" label="Collecte ouverte" />
                  ) : (
                    <StatusBadge tone="progress" label="En préparation" />
                  )}
                </td>
                <td className="pr-4 text-right font-semibold tabular-nums">
                  {p.collecte === null ? TIRET : formatFcfa(p.collecte)}
                </td>
                <td className="pr-4 text-right tabular-nums">
                  {p.part_en_ligne === null
                    ? TIRET
                    : formatPourcent(p.part_en_ligne)}
                </td>
                <td className="pr-4 text-right tabular-nums">
                  {p.quetes_a_valider === null ? TIRET : p.quetes_a_valider}
                </td>
                <td className="pr-6 text-foreground/80">
                  <span className="block">
                    {p.evolution ? EVOLUTION[p.evolution] : TIRET}
                  </span>
                  {!p.evolution && p.evolution_libelle && (
                    <span className="block text-[13px] text-muted-foreground">
                      {p.evolution_libelle}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-6 py-3 text-[13px] text-muted-foreground">
        Seule la colonne Paroisse se trie. Les montants ne servent pas à classer
        les paroisses entre elles.
      </p>
    </section>
  );
}

function QueteImperee({ data }: { data: AnalyseDiocese }) {
  const q = data.quete_imperee;
  if (!q) return null;
  const lignes = trierAlphabetique(q.lignes, (l) => l.nom);
  const somme = (k: 'en_ligne' | 'especes' | 'total' | 'remis' | 'reste') =>
    lignes.reduce((s, l) => s + (l[k] ?? 0), 0);
  const cellule = (v: number | null) => (v === null ? TIRET : formatNombre(v));
  return (
    <section
      aria-labelledby="titre-imperee"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft-sm"
    >
      <div className="px-6 pb-3 pt-5">
        <h2
          id="titre-imperee"
          className="font-sans text-xl font-semibold leading-7 tracking-normal"
        >
          Quête impérée · {q.libelle}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{q.sous_titre}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Quête impérée du {q.libelle} par paroisse, ordre alphabétique, en
            FCFA
          </caption>
          <thead className="bg-background-surface text-[13px] text-muted-foreground">
            <tr className="h-11 border-y border-border">
              <th scope="col" className="pl-6 text-left font-medium">
                Paroisse
              </th>
              <th scope="col" className="pr-4 text-right font-medium">
                En ligne
              </th>
              <th scope="col" className="pr-4 text-right font-medium">
                Espèces
              </th>
              <th scope="col" className="pr-4 text-right font-medium">
                Total
              </th>
              <th scope="col" className="pr-4 text-right font-medium">
                Remis à la curie
              </th>
              <th scope="col" className="pr-4 text-right font-medium">
                Reste à remettre
              </th>
              <th scope="col" className="pr-4 text-right font-medium">
                Échéance
              </th>
              <th scope="col" className="w-[140px] pr-6 text-left font-medium">
                Remise
              </th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => {
              const part = l.total
                ? Math.round(((l.remis ?? 0) / l.total) * 100)
                : 0;
              return (
                <tr key={l.paroisse_id} className="h-12 border-b border-border">
                  <th scope="row" className="pl-6 text-left font-semibold">
                    {l.nom}
                  </th>
                  <td className="pr-4 text-right tabular-nums">
                    {cellule(l.en_ligne)}
                  </td>
                  <td className="pr-4 text-right tabular-nums">
                    {cellule(l.especes)}
                  </td>
                  <td className="pr-4 text-right font-semibold tabular-nums">
                    {cellule(l.total)}
                  </td>
                  <td className="pr-4 text-right tabular-nums">
                    {cellule(l.remis)}
                  </td>
                  <td className="pr-4 text-right font-semibold tabular-nums">
                    {cellule(l.reste)}
                  </td>
                  <td className="pr-4 text-right tabular-nums">
                    {l.echeance ? formatJourMois(l.echeance) : TIRET}
                  </td>
                  <td className="pr-6">
                    {l.ouverte ? (
                      <Jauge
                        titre={`Remise à la curie, ${l.nom}`}
                        pourcent={part}
                        libelle={`${formatPourcent(part)} remis`}
                      />
                    ) : (
                      <span className="text-[13px] text-muted-foreground">
                        Non ouverte
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="h-12 bg-background-surface font-semibold">
              <th scope="row" className="pl-6 text-left">
                Archidiocèse
              </th>
              <td className="pr-4 text-right tabular-nums">
                {formatNombre(somme('en_ligne'))}
              </td>
              <td className="pr-4 text-right tabular-nums">
                {formatNombre(somme('especes'))}
              </td>
              <td className="pr-4 text-right tabular-nums">
                {formatNombre(somme('total'))}
              </td>
              <td className="pr-4 text-right tabular-nums">
                {formatNombre(somme('remis'))}
              </td>
              <td className="pr-4 text-right tabular-nums">
                {formatNombre(somme('reste'))}
              </td>
              <td />
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="px-6 py-3 text-[13px] text-muted-foreground">
        La part en ligne arrive sur le compte marchand de l&apos;économat et
        revient directement à la curie : seules les espèces restent à remettre.
        Chaque jauge mesure la remise de la paroisse par rapport à sa propre
        collecte.
      </p>
    </section>
  );
}

const exporter = (data: AnalyseDiocese) => {
  const csv = versCsv([
    {
      titre: `Collecté par type de fonds, arrondi au millier (${data.periode.libelle})`,
      lignes: [
        ['Type', 'Environ'],
        ...data.par_fonds.map((f) => [f.libelle, f.montant]),
      ],
    },
    {
      titre: 'Paroisses (ordre alphabétique)',
      lignes: [
        [
          'Paroisse',
          'Doyenné',
          'Collecte',
          'Collecté, environ',
          'Part en ligne (%)',
          'Quêtes à valider',
        ],
        ...trierAlphabetique(data.paroisses, (p) => p.nom).map((p) => [
          p.nom,
          p.doyenne,
          p.statut === 'collecte_ouverte'
            ? 'Collecte ouverte'
            : 'En préparation',
          p.collecte,
          p.part_en_ligne,
          p.quetes_a_valider,
        ]),
      ],
    },
  ]);
  telechargerCsv(`agregats-dons-${data.periode.debut.slice(0, 7)}.csv`, csv);
};

const OPTIONS_FONDS = [
  { valeur: '', libelle: 'Tous les types de fonds' },
  ...ORDRE_FONDS.map((t) => ({ valeur: t, libelle: LIBELLE_FONDS[t] })),
];
const OPTIONS_CANAUX = [
  { valeur: '', libelle: 'Tous les canaux' },
  { valeur: 'en_ligne', libelle: 'En ligne' },
  { valeur: 'especes', libelle: 'Espèces' },
];

export function AnalyseDioceseVue() {
  const [granularite, setGranularite] = React.useState<Granularite>('mois');
  const [mois, setMois] = React.useState(MOIS_COURANT);
  const [fonds, setFonds] = React.useState('');
  const [canal, setCanal] = React.useState('');
  const [doyenne, setDoyenne] = React.useState('');
  const filtres: FiltresAnalyse = {
    granularite,
    date: mois,
    fonds: (fonds || undefined) as TypeFonds | undefined,
    canal: canal || undefined,
    doyenne: doyenne || undefined,
  };
  const { data: brut, isLoading, error } = useAnalyseDiocese(filtres);
  const data = React.useMemo(
    () => (brut ? arrondirAgregats(brut) : undefined),
    [brut],
  );

  const doyennes = Array.from(
    new Set((data?.paroisses ?? []).map((p) => p.doyenne)),
  );
  const optionsDoyennes = [
    { valeur: '', libelle: 'Tous les doyennés' },
    ...trierAlphabetique(doyennes, (d) => d).map((d) => ({
      valeur: d,
      libelle: d,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="inline-flex items-center gap-1.5 text-[15px] text-muted-foreground">
          <Lock className="size-4" aria-hidden="true" />
          Agrégats seulement · montants arrondis au millier · ordre alphabétique
        </p>
        <button
          type="button"
          disabled={!data}
          onClick={() => data && exporter(data)}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
        >
          <Download className="size-4" aria-hidden="true" />
          Exporter les agrégats
        </button>
      </div>

      <BarreFiltres
        granularites={GRANULARITES}
        granularite={granularite}
        onGranularite={setGranularite}
        mois={mois}
        onMois={setMois}
        moisMax={MOIS_COURANT}
        filtres={[
          {
            cle: 'fonds',
            nom: 'Type de fonds',
            valeur: fonds,
            options: OPTIONS_FONDS,
            onChange: setFonds,
          },
          {
            cle: 'canal',
            nom: 'Canal',
            valeur: canal,
            options: OPTIONS_CANAUX,
            onChange: setCanal,
          },
          {
            cle: 'doyenne',
            nom: 'Doyenné',
            valeur: doyenne,
            options: optionsDoyennes,
            onChange: setDoyenne,
          },
        ]}
      />

      {error ? (
        <EtatErreur
          interdit={error instanceof ApiError && error.status === 403}
        />
      ) : isLoading || !data ? (
        <EtatChargement />
      ) : (
        <>
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              <Synthese data={data} />
              <ParMois data={data} />
            </div>
            <div className="space-y-6">
              <CompteMarchand data={data} />
              <CompteLiaison data={data} />
            </div>
          </div>
          <TableauParoisses
            paroisses={data.paroisses}
            periode={data.periode.libelle}
          />
          <QueteImperee data={data} />
          <p className="flex items-start gap-2 rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Agrégats seulement. Les montants sont arrondis au millier, sauf la
            quête impérée et les comptes de trésorerie, tenus au franc près pour
            le rapprochement.
          </p>
          <p className="text-[13px] text-muted-foreground">
            Montants en FCFA. Aucun nom de donateur dans cette vue. Comparaison
            avec l&apos;an dernier disponible à partir de septembre 2027.
          </p>
        </>
      )}
    </div>
  );
}
