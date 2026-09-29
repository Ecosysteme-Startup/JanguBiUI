'use client';

import { ArrowDownAZ, ArrowUpZA } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { ApiError } from '@/lib/api-client';

import {
  type AnalyseDons,
  type LigneParoisse,
  type Periode,
  type QueteImperee,
  useAnalyseDons,
} from '../api/get-analyse-dons';
import { useNoeudAnalyse } from '../api/get-mes-capacites';
import { useFluxDons } from '../hooks/use-flux-dons';
import { telechargerCsv, versCsv } from '../utils/export-csv';
import {
  arrondiMillier,
  formatDateLongue,
  formatFcfa,
  formatHorodatage,
  formatJourMois,
  formatNombre,
  formatPourcent,
  NBSP,
} from '../utils/format';
import { trierAlphabetique } from '../utils/ordre';
import { COULEUR_FONDS, LIBELLE_FONDS, ORDRE_FONDS } from '../utils/palette';
import { codePeriode, enPeriode, periodeEnCours, moisCourant } from '../utils/periode';

import { ATraiter } from './a-traiter';
import { BarreFiltres } from './barre-filtres';
import { BarreDeFlux } from './graphiques/barre-de-flux';
import { CarteGraphique } from './graphiques/carte-graphique';
import { ChiffreTitre } from './graphiques/chiffre-titre';
import { ColonnesEmpilees } from './graphiques/colonnes-empilees';
import {
  EtatChargement,
  EtatErreur,
  EtatVide,
} from './graphiques/etats-graphique';
import { Jauge } from './graphiques/jauge';
import {
  TableauRepartition,
  TableauSimple,
} from './graphiques/tableau-repartition';

const TIRET = '—';

// Pas de semaine au-dessus de la paroisse (400 `period_not_allowed`).
const PERIODES: { valeur: Periode; libelle: string }[] = [
  { valeur: 'mois', libelle: 'Mois' },
  { valeur: 'trimestre', libelle: 'Trimestre' },
  { valeur: 'annee', libelle: 'Année' },
];

const TITRE_GRAIN = {
  jour: 'Collecté par jour',
  semaine: 'Collecté par semaine',
  mois: 'Collecté par mois',
} as const;

const m = arrondiMillier;

/**
 * Règles d'agrégat au-dessus de la paroisse (décisions du 27/09) : le serveur
 * arrondit au millier `synthese`, `tendance` et `paroisses` ; le client
 * réapplique l'arrondi, par sûreté. Aucun masquage « moins de 5 dons » ni règle
 * de dominance. La quête impérée reste au franc près (argent de la curie, à
 * rapprocher des remises).
 */
export const arrondirAgregats = (data: AnalyseDons): AnalyseDons => ({
  ...data,
  synthese: {
    ...data.synthese,
    collecte: m(data.synthese.collecte),
    en_ligne: m(data.synthese.en_ligne),
    especes: m(data.synthese.especes),
    par_destination: {
      paroisse: m(data.synthese.par_destination.paroisse),
      curie: m(data.synthese.par_destination.curie),
    },
    par_type_fonds: data.synthese.par_type_fonds.map((f) => ({
      ...f,
      en_ligne: m(f.en_ligne),
      especes: m(f.especes),
      total: m(f.total),
    })),
    par_canal: data.synthese.par_canal.map((c) => ({
      ...c,
      total: m(c.total),
      sources: c.sources.map((s) => ({ ...s, total: m(s.total) })),
    })),
    par_moyen: data.synthese.par_moyen.map((x) => ({
      ...x,
      total: m(x.total),
    })),
  },
  tendance: {
    ...data.tendance,
    points: data.tendance.points.map((p) => ({
      ...p,
      total: m(p.total),
      en_ligne: m(p.en_ligne),
      especes: m(p.especes),
      par_type_fonds: {
        quete_dominicale: m(p.par_type_fonds.quete_dominicale),
        quete_imperee: m(p.par_type_fonds.quete_imperee),
        campagne: m(p.par_type_fonds.campagne),
        contribution_annuelle: m(p.par_type_fonds.contribution_annuelle),
      },
    })),
  },
  paroisses: data.paroisses && {
    ...data.paroisses,
    lignes: data.paroisses.lignes.map((p) => ({
      ...p,
      collecte: p.collecte === null ? null : m(p.collecte),
    })),
  },
});

const EVOLUTION: Record<NonNullable<LigneParoisse['evolution']>, string> = {
  stable: 'stable',
  en_hausse: 'en hausse',
  en_baisse: 'en baisse',
};

const LIEU_NOEUD: Record<string, string> = {
  diocese: 'dans le diocèse',
  doyenne: 'dans le doyenné',
};

function Synthese({ data }: { data: AnalyseDons }) {
  const s = data.synthese;
  const fonds = s.par_type_fonds;
  const periode = enPeriode(data.periode);
  const compteurs = data.paroisses?.compteurs;
  const lieu = /archidioc/i.test(data.noeud.nom)
    ? "dans l'archidiocèse"
    : (LIEU_NOEUD[data.noeud.type] ?? `à ${data.noeud.nom}`);
  return (
    <section
      aria-labelledby="titre-synthese-dio"
      className="rounded-16 border border-line bg-surface px-6 py-5 shadow-card"
    >
      <h2 id="titre-synthese-dio" className="sr-only">
        Synthèse
      </h2>
      <ChiffreTitre
        libelle={`Collecté via Jàngu Bi ${periode}`}
        horodatage={`au ${formatHorodatage(data.genere_le)}`}
        badge={
          periodeEnCours(data.periode, data.genere_le) && (
            <Badge tone="info">{`${data.periode.type === 'mois' ? 'Mois' : 'Période'} en cours · chiffres provisoires`}</Badge>
          )
        }
        avant="Environ"
        valeur={formatNombre(s.collecte)}
        unite="FCFA"
      >
        <br />
        collectés {lieu}, dont{' '}
        <strong className="font-semibold text-ink">
          {formatNombre(s.par_destination.curie)}
        </strong>{' '}
        destinés à la curie.
        {compteurs && (
          <>
            {' '}
            <strong className="font-semibold text-ink">
              {compteurs.collecte_ouverte} paroisse
              {compteurs.collecte_ouverte > 1 ? 's' : ''} sur{' '}
              {compteurs.engagees}
            </strong>{' '}
            engagées collecte{compteurs.collecte_ouverte > 1 ? 'nt' : ''}
            {compteurs.en_preparation > 0 &&
              ` ; ${compteurs.en_preparation} ${compteurs.en_preparation > 1 ? 'sont' : 'est'} en préparation`}
            .
          </>
        )}
      </ChiffreTitre>
      {s.collecte === 0 ? (
        <EtatVide className="mt-4" />
      ) : (
        <>
          <BarreDeFlux
            className="mt-4"
            titre="Répartition par type de fonds"
            segments={fonds.map((f) => ({
              cle: f.type,
              libelle: LIBELLE_FONDS[f.type],
              valeur: f.total,
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
              valeur: f.total,
              couleur: COULEUR_FONDS[f.type],
            }))}
            total={s.collecte}
          />
        </>
      )}
      <p className="mt-3 text-13 leading-[18px] text-ink-3">
        Mesure : montant donné, en ligne et quêtes en espèces validées. Arrondis
        au millier : la somme peut différer du total.
      </p>
    </section>
  );
}

function Tendance({ data }: { data: AnalyseDons }) {
  const points = data.tendance.points;
  const titre = TITRE_GRAIN[data.tendance.grain];
  const series = ORDRE_FONDS.filter((t) =>
    points.some((p) => p.par_type_fonds[t] > 0),
  ).map((t) => ({
    cle: t,
    libelle: LIBELLE_FONDS[t],
    couleur: COULEUR_FONDS[t],
  }));
  return (
    <CarteGraphique
      titre={titre}
      sousTitre={`Par type de fonds · en milliers${NBSP}de FCFA, arrondis`}
      graphique={
        points.length === 0 ? (
          <EtatVide />
        ) : (
          <ColonnesEmpilees
            resume={`${titre} : ${points.map((p) => `${p.libelle} environ ${formatFcfa(p.total)}`).join(' ; ')}.`}
            diviseur={1000}
            series={series}
            periodes={points.map((p) => ({
              cle: p.debut,
              libelle: p.libelle,
              titreInfobulle: `Du ${formatJourMois(p.debut)} au ${formatJourMois(p.fin)}`,
              valeurs: p.par_type_fonds,
            }))}
          />
        )
      }
      tableau={
        <TableauSimple
          caption={`${titre} et par type de fonds, montants arrondis au millier de FCFA`}
          colonnes={[
            { libelle: 'Période' },
            ...series.map((s) => ({
              libelle: s.libelle,
              alignement: 'droite' as const,
            })),
            { libelle: 'Total', alignement: 'droite' },
          ]}
          lignes={points.map((p) => ({
            cle: p.debut,
            cellules: [
              p.libelle,
              ...series.map((s) => formatNombre(p.par_type_fonds[s.cle])),
              formatNombre(p.total),
            ],
          }))}
        />
      }
      pied={
        <p>
          Chaque paroisse n&apos;est comparée qu&apos;à elle-même, sur ses trois
          périodes précédentes.
        </p>
      }
    />
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
      className="overflow-hidden rounded-16 border border-line bg-surface shadow-card"
    >
      <div className="px-6 pb-3 pt-5">
        <h2
          id="titre-paroisses"
          className="font-sans text-20 font-semibold leading-7"
        >
          Paroisses
        </h2>
        <p className="mt-0.5 text-14 text-ink-3">
          Paroisses engagées, par ordre alphabétique · {periode} · chaque
          évolution se lit par rapport à la paroisse elle-même
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-14">
          <caption className="sr-only">
            Paroisses engagées, ordre alphabétique, {periode}, montants arrondis
            au millier de FCFA
          </caption>
          <thead className="bg-surface text-13 text-ink-3">
            <tr className="h-11 border-y border-line">
              <th
                scope="col"
                aria-sort={inverse ? 'descending' : 'ascending'}
                className="pl-6 text-left font-medium"
              >
                <button
                  type="button"
                  onClick={() => setInverse((v) => !v)}
                  className="inline-flex items-center gap-1 font-semibold text-ink"
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
                className="h-14 border-b border-line"
              >
                <th
                  scope="row"
                  className="py-2 pl-6 text-left font-semibold text-ink"
                >
                  {p.nom}
                </th>
                <td>
                  {p.statut_collecte === 'ouverte' ? (
                    <Badge tone="ok">Collecte ouverte</Badge>
                  ) : (
                    <Badge tone="info">En préparation</Badge>
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
                <td className="pr-6 text-ink-2">
                  <span className="block">
                    {p.evolution ? EVOLUTION[p.evolution] : TIRET}
                  </span>
                  {!p.evolution && p.statut_collecte === 'ouverte' && (
                    <span className="block text-13 text-ink-3">
                      Moins de trois périodes
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-6 py-3 text-13 text-ink-3">
        Seule la colonne Paroisse se trie. Les montants ne servent pas à classer
        les paroisses entre elles.
      </p>
    </section>
  );
}

function QueteImpereeCarte({ q }: { q: QueteImperee }) {
  const lignes = trierAlphabetique(q.paroisses, (l) => l.nom);
  const somme = (
    k:
      | 'en_ligne'
      | 'especes'
      | 'total'
      | 'remis'
      | 'remise_declaree'
      | 'reste_a_remettre',
  ) => lignes.reduce((s, l) => s + l[k], 0);
  const titreId = `titre-imperee-${q.fonds_id}`;
  const sousTitre = [
    `Quête du ${formatDateLongue(q.date)}`,
    q.messe_anticipee_incluse ? 'messe anticipée incluse' : null,
    q.echeance
      ? `remise attendue avant le ${formatJourMois(q.echeance)}`
      : null,
    'en FCFA, montants exacts (argent destiné à la curie)',
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <section
      aria-labelledby={titreId}
      className="overflow-hidden rounded-16 border border-line bg-surface shadow-card"
    >
      <div className="px-6 pb-3 pt-5">
        <h2 id={titreId} className="font-sans text-20 font-semibold leading-7">
          {q.titre}
        </h2>
        <p className="mt-0.5 text-14 text-ink-3">{sousTitre}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-14">
          <caption className="sr-only">
            {q.titre} par paroisse, ordre alphabétique, en FCFA
          </caption>
          <thead className="bg-surface text-13 text-ink-3">
            <tr className="h-11 border-y border-line">
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
                Déclaré, à confirmer
              </th>
              <th scope="col" className="pr-4 text-right font-medium">
                Reste à remettre
              </th>
              <th scope="col" className="w-[140px] pr-6 text-left font-medium">
                Remise
              </th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => {
              const part = l.part_remise ?? 0;
              return (
                <tr key={l.id} className="h-12 border-b border-line">
                  <th scope="row" className="pl-6 text-left font-semibold">
                    {l.nom}
                  </th>
                  <td className="pr-4 text-right tabular-nums">
                    {formatNombre(l.en_ligne)}
                  </td>
                  <td className="pr-4 text-right tabular-nums">
                    {formatNombre(l.especes)}
                  </td>
                  <td className="pr-4 text-right font-semibold tabular-nums">
                    {formatNombre(l.total)}
                  </td>
                  <td className="pr-4 text-right tabular-nums">
                    {formatNombre(l.remis)}
                  </td>
                  <td className="pr-4 text-right tabular-nums">
                    {formatNombre(l.remise_declaree)}
                  </td>
                  <td className="pr-4 text-right font-semibold tabular-nums">
                    {formatNombre(l.reste_a_remettre)}
                  </td>
                  <td className="pr-6">
                    {l.part_remise === null ? (
                      <span className="text-13 text-ink-3">{TIRET}</span>
                    ) : (
                      <Jauge
                        titre={`Remise à la curie, ${l.nom}`}
                        pourcent={part}
                        libelle={`${formatPourcent(part)} remis`}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {lignes.length > 1 && (
            <tfoot>
              <tr className="h-12 bg-surface font-semibold">
                <th scope="row" className="pl-6 text-left">
                  Total
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
                  {formatNombre(somme('remise_declaree'))}
                </td>
                <td className="pr-4 text-right tabular-nums">
                  {formatNombre(somme('reste_a_remettre'))}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <p className="px-6 py-3 text-13 text-ink-3">
        La part en ligne arrive sur le compte marchand de l&apos;économat et
        revient directement à la curie : seules les espèces restent à remettre.
        Chaque jauge mesure la remise de la paroisse par rapport à sa propre
        collecte.
      </p>
    </section>
  );
}

const exporter = (data: AnalyseDons) => {
  const csv = versCsv([
    {
      titre: `Collecté par type de fonds, arrondi au millier (${data.periode.libelle})`,
      lignes: [
        ['Type', 'Environ'],
        ...data.synthese.par_type_fonds.map((f) => [f.libelle, f.total]),
      ],
    },
    {
      titre: 'Paroisses (ordre alphabétique)',
      lignes: [
        [
          'Paroisse',
          'Collecte',
          'Collecté, environ',
          'Part en ligne (%)',
          'Quêtes à valider',
        ],
        ...trierAlphabetique(data.paroisses?.lignes ?? [], (p) => p.nom).map(
          (p) => [
            p.nom,
            p.statut_collecte === 'ouverte'
              ? 'Collecte ouverte'
              : 'En préparation',
            p.collecte,
            p.part_en_ligne,
            p.quetes_a_valider,
          ],
        ),
      ],
    },
  ]);
  telechargerCsv(`agregats-dons-${data.periode.code}.csv`, csv);
};

export function AnalyseDioceseVue({ nodeId }: { nodeId: string }) {
  const [periode, setPeriode] = React.useState<Periode>('mois');
  // Mois du jour à Dakar, figé au montage : mois par défaut et borne haute du sélecteur.
  const [moisDuJour] = React.useState(moisCourant);
  const [mois, setMois] = React.useState(moisDuJour);
  const { noeud, isLoading: chargementNoeud } = useNoeudAnalyse(
    'diocese',
    nodeId,
  );
  const {
    data: brut,
    isLoading,
    error,
  } = useAnalyseDons({
    niveau: 'diocese',
    noeud: noeud?.id,
    periode,
    date: codePeriode(periode, mois, moisDuJour),
  });
  useFluxDons({ niveau: 'diocese', noeud: noeud?.id });
  const data = React.useMemo(
    () => (brut ? arrondirAgregats(brut) : undefined),
    [brut],
  );
  const sansNoeud = !chargementNoeud && !noeud;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="inline-flex items-center gap-1.5 text-15 text-ink-3">
          <Icon name="cadenas" className="size-4" aria-hidden="true" />
          Agrégats seulement · montants arrondis au millier · ordre alphabétique
        </p>
        <button
          type="button"
          disabled={!data}
          onClick={() => data && exporter(data)}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-14 font-semibold text-ink hover:bg-surface-2 disabled:opacity-50"
        >
          <Icon name="import" className="size-4" aria-hidden="true" />
          Exporter les agrégats
        </button>
      </div>

      <BarreFiltres
        granularites={PERIODES}
        granularite={periode}
        onGranularite={setPeriode}
        mois={mois}
        onMois={setMois}
        moisMax={moisDuJour}
        filtres={[]}
      />

      {sansNoeud ? (
        <EtatErreur interdit />
      ) : error ? (
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
              <Tendance data={data} />
            </div>
            <ATraiter elements={data.a_traiter} />
          </div>
          {data.paroisses && (
            <TableauParoisses
              paroisses={data.paroisses.lignes}
              periode={data.periode.libelle}
            />
          )}
          {data.quetes_imperees.map((q) => (
            <QueteImpereeCarte key={q.fonds_id} q={q} />
          ))}
          <p className="flex items-start gap-2 rounded-xl bg-surface-2 px-4 py-3 text-14 text-ink-2">
            <Icon name="info" className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Agrégats seulement. Les montants sont arrondis au millier, sauf la
            quête impérée, tenue au franc près pour le rapprochement avec les
            remises.
          </p>
          {data.notes.length > 0 && (
            <div className="space-y-1 text-13 text-ink-3">
              {data.notes.map((n) => (
                <p key={n}>{n}</p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
