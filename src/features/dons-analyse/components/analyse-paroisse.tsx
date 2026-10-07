'use client';

import NextLink from 'next/link';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-client';
import { useCan } from '@/lib/can';

import {
  type AnalyseDons,
  type Campagne,
  type Periode,
  useAnalyseDons,
} from '../api/get-analyse-dons';
import { useNoeudAnalyse } from '../api/get-mes-capacites';
import { useFluxDons } from '../hooks/use-flux-dons';
import { telechargerCsv, versCsv } from '../utils/export-csv';
import {
  capitaliser,
  formatDateLongue,
  formatDuree,
  formatFcfa,
  formatHorodatage,
  formatJourMois,
  formatNombre,
  formatPourcent,
  NBSP,
  partPourcent,
} from '../utils/format';
import {
  COULEUR_FONDS,
  LIBELLE_FONDS,
  ORDRE_FONDS,
  STATUTS_PAIEMENT,
} from '../utils/palette';
import { codePeriode, enPeriode, periodeEnCours, moisCourant } from '../utils/periode';
import {
  type LigneRepartition,
  lignesCanal,
  lignesLieu,
  lignesMoyen,
} from '../utils/repartition';

import { ATraiter } from './a-traiter';
import { BarreFiltres } from './barre-filtres';
import { BarreDeFlux } from './graphiques/barre-de-flux';
import { Carte, CarteGraphique } from './graphiques/carte-graphique';
import { ChiffreTitre } from './graphiques/chiffre-titre';
import { ColonnesEmpilees } from './graphiques/colonnes-empilees';
import {
  EtatChargement,
  EtatErreur,
  EtatVide,
} from './graphiques/etats-graphique';
import { Jauge } from './graphiques/jauge';
import {
  type LigneTableauRepartition,
  TableauRepartition,
  TableauSimple,
} from './graphiques/tableau-repartition';
import { Onglets } from './onglets-dons';

const PERIODES: { valeur: Periode; libelle: string }[] = [
  { valeur: 'semaine', libelle: 'Semaine' },
  { valeur: 'mois', libelle: 'Mois' },
  { valeur: 'trimestre', libelle: 'Trimestre' },
  { valeur: 'annee', libelle: 'Année' },
];

const TITRE_GRAIN = {
  jour: 'Flux par jour',
  semaine: 'Flux par semaine',
  mois: 'Flux par mois',
} as const;

const complement = (l: LigneRepartition) => {
  if (l.nombre === null || !l.unite || l.non_renseigne) return null;
  if (l.nombre === 0)
    return l.unite === 'quêtes' ? 'aucune quête' : 'aucun don';
  return `${l.nombre}${NBSP}${l.unite}`;
};

const versLignes = (lignes: LigneRepartition[]): LigneTableauRepartition[] =>
  lignes.map((l) => ({
    cle: l.code,
    libelle: l.libelle,
    complement: complement(l),
    valeur: l.montant,
    niveau: l.niveau,
    nonRenseigne: l.non_renseigne,
    forte: l.niveau === 0 && lignes.some((x) => x.niveau === 1),
  }));

/** Vue tableau d'une répartition : libellé, nombre, montant, part. */
function TableauNombres({
  caption,
  entete,
  lignes,
  total,
}: {
  caption: string;
  entete: string;
  lignes: LigneRepartition[];
  total: number;
}) {
  return (
    <TableauSimple
      caption={caption}
      colonnes={[
        { libelle: entete },
        { libelle: 'Nombre', alignement: 'droite' },
        { libelle: 'Montant', alignement: 'droite' },
        { libelle: 'Part', alignement: 'droite' },
      ]}
      lignes={lignes.map((l) => ({
        cle: l.code,
        cellules: [
          <span key="l" className={l.niveau ? 'pl-4 text-ink-2' : undefined}>
            {l.libelle}
          </span>,
          l.nombre === null ? '—' : `${l.nombre} ${l.unite ?? ''}`.trim(),
          formatNombre(l.montant),
          formatPourcent(partPourcent(l.montant, total)),
        ],
      }))}
      pied={['Total', '', formatNombre(total), formatPourcent(100)]}
    />
  );
}

/** « Quête impérée · Grand Séminaire de Brin » → « Grand Séminaire de Brin ». */
const objetImperee = (titre: string) =>
  titre.replace(/^Quête impérée\s*·\s*/, '');

function Synthese({ data }: { data: AnalyseDons }) {
  const s = data.synthese;
  const fonds = s.par_type_fonds;
  const periode = enPeriode(data.periode);
  const imperee = data.quetes_imperees[0];
  const aConfirmer = data.tresorerie?.especes.a_confirmer ?? 0;
  const quetesAConfirmer = data.a_traiter
    .filter((e) => e.type === 'quete_a_confirmer')
    .reduce((n, e) => n + e.nombre, 0);
  return (
    <section
      aria-labelledby="titre-synthese"
      className="rounded-16 border border-line bg-surface px-6 py-5 shadow-card"
    >
      <h2 id="titre-synthese" className="sr-only">
        Synthèse
      </h2>
      <ChiffreTitre
        libelle={`Collecté ${periode}`}
        horodatage={`au ${formatHorodatage(data.genere_le)}`}
        valeur={formatNombre(s.collecte)}
        unite="FCFA"
      >
        collectés {periode} à {data.noeud.nom}
        {s.par_destination.curie > 0 ? (
          <>
            , dont{' '}
            <strong className="font-semibold text-ink">
              {formatNombre(s.par_destination.paroisse)}
            </strong>{' '}
            pour la paroisse et{' '}
            <strong className="font-semibold text-ink">
              {formatNombre(s.par_destination.curie)}
            </strong>{' '}
            pour la quête impérée
            {imperee ? ` du ${objetImperee(imperee.titre)}` : ''}, à remettre à
            la curie.
          </>
        ) : (
          '.'
        )}
      </ChiffreTitre>
      {s.collecte === 0 ? (
        <EtatVide
          className="mt-4"
          detail="Les dons en ligne et les quêtes validées apparaîtront ici."
        />
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
            caption={`Collecté ${periode} par type de fonds, en FCFA`}
            entete={{ libelle: 'Type de fonds', valeur: 'Montant' }}
            barres={false}
            lignes={fonds.map((f) => ({
              cle: f.type,
              libelle: f.libelle,
              valeur: f.total,
              couleur: COULEUR_FONDS[f.type],
            }))}
            total={s.collecte}
          />
          <p className="mt-3 text-13 leading-[18px] text-ink-3">
            En ligne : {formatNombre(s.en_ligne)} ({s.nombre_dons_en_ligne}{' '}
            dons) · espèces : {formatNombre(s.especes)} ({s.nombre_quetes}{' '}
            quêtes validées).
            {aConfirmer > 0 &&
              (quetesAConfirmer > 1
                ? ` ${quetesAConfirmer} quêtes (${formatNombre(aConfirmer)}) attendent leur confirmation et ne sont pas comptées.`
                : ` Une quête de ${formatNombre(aConfirmer)} attend sa confirmation et n'est pas comptée.`)}
          </p>
        </>
      )}
    </section>
  );
}

function Tendance({ data }: { data: AnalyseDons }) {
  const points = data.tendance.points;
  const series = ORDRE_FONDS.filter((t) =>
    points.some((p) => p.par_type_fonds[t] > 0),
  ).map((t) => ({
    cle: t,
    libelle: LIBELLE_FONDS[t],
    couleur: COULEUR_FONDS[t],
  }));
  const titre = TITRE_GRAIN[data.tendance.grain];
  const resume = `${titre} : ${points
    .map((p) => `${p.libelle} ${formatFcfa(p.total)}`)
    .join(' ; ')}.`;
  const sousTitre =
    data.tendance.grain === 'semaine'
      ? `Collecté par type de fonds, en milliers${NBSP}de FCFA · semaines terminées le dimanche`
      : `Collecté par type de fonds, en milliers${NBSP}de FCFA`;
  return (
    <CarteGraphique
      titre={titre}
      sousTitre={sousTitre}
      graphique={
        points.length === 0 ? (
          <EtatVide />
        ) : (
          <ColonnesEmpilees
            resume={resume}
            diviseur={1000}
            series={series}
            periodes={points.map((p) => ({
              cle: p.debut,
              libelle: p.libelle,
              titreInfobulle:
                p.debut === p.fin
                  ? capitaliser(formatDateLongue(p.debut))
                  : `Du ${formatJourMois(p.debut)} au ${formatJourMois(p.fin)}`,
              valeurs: p.par_type_fonds,
            }))}
          />
        )
      }
      tableau={
        <TableauSimple
          caption={`${titre}, collecté par type de fonds, en FCFA`}
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
              `${p.libelle} (${formatJourMois(p.debut)} au ${formatJourMois(p.fin)})`,
              ...series.map((x) => formatNombre(p.par_type_fonds[x.cle])),
              formatNombre(p.total),
            ],
          }))}
          pied={[
            'Total',
            ...series.map((x) =>
              formatNombre(
                points.reduce((t, p) => t + p.par_type_fonds[x.cle], 0),
              ),
            ),
            formatNombre(points.reduce((t, p) => t + p.total, 0)),
          ]}
        />
      }
    />
  );
}

function CarteRepartition({
  titre,
  sousTitre,
  entete,
  lignes,
  total,
  caption,
  pied,
}: {
  titre: string;
  sousTitre: string;
  entete: string;
  lignes: LigneRepartition[];
  total: number;
  caption: string;
  pied?: React.ReactNode;
}) {
  return (
    <CarteGraphique
      titre={titre}
      sousTitre={sousTitre}
      graphique={
        lignes.length === 0 ? (
          <EtatVide />
        ) : (
          <TableauRepartition
            caption={caption}
            entete={{ libelle: entete, valeur: 'Montant' }}
            lignes={versLignes(lignes)}
            total={total}
          />
        )
      }
      tableau={
        <TableauNombres
          caption={caption}
          entete={entete}
          lignes={lignes}
          total={total}
        />
      }
      pied={pied}
    />
  );
}

function PaiementsEnLigne({
  data,
  nodeId,
}: {
  data: AnalyseDons;
  nodeId: string;
}) {
  const p = data.paiements;
  if (!p) return null;
  const statuts = STATUTS_PAIEMENT.map((s) => ({ ...s, valeur: p[s.cle] }));
  const taux = p.taux_confirmation ?? partPourcent(p.confirmes, p.lances);
  const attente = data.a_traiter.find((e) => e.type === 'paiements_en_attente');
  const lignesTableau = statuts.map((s) => ({
    cle: s.cle,
    libelle: s.libelle,
    valeur: s.valeur,
    couleur: s.couleur,
  }));
  return (
    <CarteGraphique
      titre="Paiements en ligne"
      sousTitre={`Paiements lancés ${enPeriode(data.periode)}, en nombre`}
      graphique={
        p.lances === 0 ? (
          <EtatVide titre="Aucun paiement en ligne lancé sur cette période." />
        ) : (
          <>
            <p className="text-15 leading-6 text-ink-2">
              <strong className="font-semibold text-ink">
                {p.confirmes} des {p.lances} paiements
              </strong>{' '}
              lancés ont abouti ({formatPourcent(taux)}).
              {p.en_attente > 0 &&
                ` ${p.en_attente} ${p.en_attente > 1 ? 'sont' : 'est'} encore en attente${
                  attente?.depuis
                    ? `, le plus ancien depuis ${formatDuree(attente.depuis, data.genere_le, true)}`
                    : ''
                }.`}
            </p>
            <BarreDeFlux
              className="mt-4"
              hauteur={8}
              titre="Paiements par statut"
              segments={statuts.map((s) => ({
                cle: s.cle,
                libelle: s.libelle,
                valeur: s.valeur,
                couleur: s.couleur,
              }))}
            />
            <TableauRepartition
              className="mt-3"
              caption="Paiements en ligne lancés, par statut"
              entete={{ libelle: 'Statut', valeur: 'Paiements' }}
              barres={false}
              formatValeur={(n) => String(n)}
              lignes={lignesTableau}
              total={p.lances}
            />
          </>
        )
      }
      tableau={
        <TableauRepartition
          caption="Paiements en ligne lancés, par statut"
          entete={{ libelle: 'Statut', valeur: 'Paiements' }}
          barres={false}
          formatValeur={(n) => String(n)}
          lignes={lignesTableau.map((l) => ({ ...l, couleur: undefined }))}
          total={p.lances}
        />
      }
      pied={
        <div className="flex items-center justify-end gap-3">
          <NextLink
            href={paths.espace.dons.root.getHref(nodeId)}
            className="text-14 font-semibold text-primary"
          >
            Voir les opérations
          </NextLink>
        </div>
      }
    />
  );
}

function LigneReleve({
  libelle,
  valeur,
  retrait,
  forte,
}: {
  libelle: string;
  valeur: string;
  retrait?: boolean;
  forte?: boolean;
}) {
  return (
    <div
      className={`flex h-9 items-center justify-between gap-3 border-t border-line text-14 first:border-t-0 ${
        forte ? 'font-semibold text-ink' : 'text-ink'
      }`}
    >
      <dt className={retrait ? 'pl-4 text-ink-2' : undefined}>{libelle}</dt>
      <dd className="tabular-nums">{valeur}</dd>
    </div>
  );
}

function TresorerieCarte({ data }: { data: AnalyseDons }) {
  const t = data.tresorerie;
  if (!t) return null;
  const l = t.en_ligne;
  const e = t.especes;
  const partReverse = l.part_reversee ?? partPourcent(l.reverse, l.net);
  return (
    <Carte
      titre="Trésorerie"
      sousTitre={`Où en est l'argent ${enPeriode(data.periode).replace(/^en /, 'de ')}, en FCFA · relevé, sans cascade`}
    >
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="text-13 font-medium text-ink-3">En ligne</h3>
          <dl className="mt-1">
            <LigneReleve
              libelle="Payé en ligne"
              valeur={formatNombre(l.paye)}
            />
            <LigneReleve
              libelle="Frais de paiement"
              valeur={formatNombre(-l.frais)}
            />
            <LigneReleve
              libelle="Net en ligne"
              valeur={formatNombre(l.net)}
              forte
            />
            <LigneReleve
              retrait
              libelle="dont reversé à l'économat"
              valeur={formatNombre(l.reverse)}
            />
            <LigneReleve
              retrait
              libelle="dont en attente de reversement"
              valeur={formatNombre(l.en_attente_reversement)}
            />
          </dl>
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-13">
              <span className="text-ink">Reversement du net en ligne</span>
            </div>
            <Jauge
              titre="Reversement du net en ligne"
              pourcent={partReverse}
              libelle={`${formatPourcent(partReverse)} reversé`}
            />
          </div>
          <p className="mt-3 text-14 text-ink-2">
            {l.net_pour_100 !== null &&
              `Pour 100 FCFA donnés en ligne, ${l.net_pour_100} FCFA arrivent. `}
            {l.dons_frais_couverts} dons sur {l.nombre} couvrent les frais.
          </p>
        </div>
        <div>
          <h3 className="text-13 font-medium text-ink-3">Espèces</h3>
          <dl className="mt-1">
            <LigneReleve
              libelle="Quêtes validées"
              valeur={formatNombre(e.validees)}
            />
            <LigneReleve
              retrait
              libelle="dont déposées à la banque"
              valeur={formatNombre(e.deposees)}
            />
            <LigneReleve
              retrait
              libelle="dont en caisse"
              valeur={formatNombre(e.en_caisse)}
            />
            <LigneReleve
              libelle="Quête à confirmer, non comptée"
              valeur={formatNombre(e.a_confirmer)}
            />
          </dl>
        </div>
      </div>
    </Carte>
  );
}

function CarteCampagne({
  c,
  periodeLibelle,
}: {
  c: Campagne;
  periodeLibelle: string;
}) {
  const pourcent =
    c.part ?? (c.objectif ? partPourcent(c.reuni, c.objectif) : null);
  const bornes =
    c.debut && c.fin
      ? `Du ${formatDateLongue(c.debut, false)} au ${formatDateLongue(c.fin)}`
      : c.debut
        ? `Depuis le ${formatDateLongue(c.debut)}`
        : null;
  return (
    <Carte
      titre={`Campagne : ${c.titre}`}
      sousTitre={[bornes, 'en FCFA'].filter(Boolean).join(' · ')}
    >
      <div className="mt-4 grid items-start gap-8 md:grid-cols-2">
        <div>
          {c.objectif && pourcent !== null && (
            <Jauge
              position="droite"
              titre="Progression de la campagne"
              pourcent={pourcent}
              libelle={formatPourcent(pourcent)}
            />
          )}
          <p className="mt-3 text-15 leading-6 text-ink-2">
            <strong className="font-semibold text-ink">
              {formatFcfa(c.reuni)}
            </strong>{' '}
            réunis
            {c.objectif
              ? ` sur ${formatNombre(c.objectif)}${pourcent !== null ? ` (${formatPourcent(pourcent)})` : ''}`
              : ''}
            , {c.nombre} dons.
          </p>
          <p className="mt-2 text-14 text-ink-2">
            {capitaliser(periodeLibelle)} : {formatFcfa(c.periode)}.
            {c.rythme_hebdo > 0 && c.projection_fin !== null
              ? ` Au rythme des quatre dernières semaines (${formatFcfa(c.rythme_hebdo)} par semaine), environ ${formatFcfa(c.projection_fin)}${c.fin ? ` au ${formatDateLongue(c.fin, false)}` : ''}${c.part_projection !== null ? ` (${formatPourcent(c.part_projection)})` : ''}.`
              : ''}
          </p>
        </div>
        <dl>
          <LigneReleve libelle="Réuni" valeur={formatNombre(c.reuni)} forte />
          {c.objectif !== null && (
            <LigneReleve libelle="Objectif" valeur={formatNombre(c.objectif)} />
          )}
          <LigneReleve
            libelle="Rythme hebdomadaire"
            valeur={formatNombre(c.rythme_hebdo)}
          />
          {c.projection_fin !== null && (
            <LigneReleve
              libelle="Projection à la fin"
              valeur={formatNombre(c.projection_fin)}
            />
          )}
        </dl>
      </div>
    </Carte>
  );
}

const exporter = (data: AnalyseDons) => {
  const rep = (l: LigneRepartition) => [l.libelle, l.nombre, l.montant];
  const s = data.synthese;
  const csv = versCsv([
    {
      titre: `Collecté par type de fonds (${data.periode.libelle})`,
      lignes: [
        ['Type', 'En ligne', 'Espèces', 'Total'],
        ...s.par_type_fonds.map((f) => [
          f.libelle,
          f.en_ligne,
          f.especes,
          f.total,
        ]),
      ],
    },
    {
      titre: TITRE_GRAIN[data.tendance.grain],
      lignes: [
        ['Période', ...ORDRE_FONDS.map((t) => LIBELLE_FONDS[t]), 'Total'],
        ...data.tendance.points.map((p) => [
          p.libelle,
          ...ORDRE_FONDS.map((t) => p.par_type_fonds[t]),
          p.total,
        ]),
      ],
    },
    {
      titre: "Par canal d'entrée",
      lignes: [
        ['Canal', 'Nombre', 'Montant'],
        ...lignesCanal(s.par_canal).map(rep),
      ],
    },
    {
      titre: 'Dons en ligne par moyen',
      lignes: [
        ['Moyen', 'Nombre', 'Montant'],
        ...lignesMoyen(s.par_moyen).map(rep),
      ],
    },
    {
      titre: 'Par lieu de culte',
      lignes: [
        ['Lieu', 'Nombre', 'Montant'],
        ...lignesLieu(s.par_lieu ?? []).map(rep),
      ],
    },
  ]);
  telechargerCsv(`analyse-dons-${data.periode.code}.csv`, csv);
};

export function AnalyseParoisseVue({ nodeId }: { nodeId: string }) {
  // Export réservé à la capacité `dons.exporter` (cohérent avec la page Dons) : masqué sinon,
  // pour que le secrétariat ne puisse pas exporter depuis l'Analyse (JB-WEB-035).
  const canExport = useCan('dons.exporter', nodeId);
  const [periode, setPeriode] = React.useState<Periode>('mois');
  // Mois du jour à Dakar, figé au montage : mois par défaut et borne haute du sélecteur.
  const [moisDuJour] = React.useState(moisCourant);
  const [mois, setMois] = React.useState(moisDuJour);
  const { noeud, isLoading: chargementNoeud } = useNoeudAnalyse(
    'paroisse',
    nodeId,
  );

  const { data, isLoading, error } = useAnalyseDons({
    niveau: 'paroisse',
    noeud: noeud?.id,
    periode,
    date: codePeriode(periode, mois, moisDuJour),
  });
  const flux = useFluxDons({ niveau: 'paroisse', noeud: noeud?.id });

  const sansNoeud = !chargementNoeud && !noeud;

  return (
    <div className="space-y-6">
      <div>
        {data && (
          <div className="flex flex-wrap items-center gap-2 text-14 text-ink-3">
            <span>
              {data.noeud.nom} · {data.periode.libelle} · chiffres au{' '}
              {formatHorodatage(data.genere_le)}
            </span>
            {periodeEnCours(data.periode, data.genere_le) && (
              <Badge tone="info">{`${data.periode.type === 'mois' ? 'Mois' : 'Période'} en cours · chiffres provisoires`}</Badge>
            )}
            {flux === 'ouvert' && (
              <span className="text-13">Mis à jour en direct</span>
            )}
          </div>
        )}
        <Onglets
          className="mt-4"
          actif="analyse"
          onglets={[
            {
              cle: 'operations',
              libelle: 'Opérations',
              href: paths.espace.dons.root.getHref(nodeId),
            },
            {
              cle: 'analyse',
              libelle: 'Analyse',
              href: paths.espace.dons.analyse.getHref(nodeId),
            },
          ]}
        />
      </div>

      <BarreFiltres
        granularites={PERIODES}
        granularite={periode}
        onGranularite={setPeriode}
        mois={mois}
        onMois={setMois}
        moisMax={moisDuJour}
        filtres={[]}
        fin={
          canExport ? (
            <button
              type="button"
              disabled={!data}
              onClick={() => data && exporter(data)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-14 font-semibold text-ink hover:bg-surface-2 disabled:opacity-50"
            >
              <Icon name="import" className="size-4" aria-hidden="true" />
              Exporter
            </button>
          ) : undefined
        }
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
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_352px]">
            <Synthese data={data} />
            <ATraiter elements={data.a_traiter} />
          </div>
          {data.synthese.collecte > 0 && (
            <>
              <Tendance data={data} />
              <div className="grid items-start gap-6 lg:grid-cols-2">
                <CarteRepartition
                  titre="Par canal d'entrée"
                  sousTitre={`Collecté ${enPeriode(data.periode)}, en FCFA`}
                  entete="Canal"
                  caption="Collecté par canal d'entrée, en FCFA"
                  lignes={lignesCanal(data.synthese.par_canal)}
                  total={data.synthese.collecte}
                  pied={
                    <p>
                      En ligne : {data.synthese.nombre_dons_en_ligne} dons. Les
                      pourcentages portent sur le total collecté.
                    </p>
                  }
                />
                <PaiementsEnLigne data={data} nodeId={nodeId} />
              </div>
              <div className="grid items-start gap-6 lg:grid-cols-2">
                <CarteRepartition
                  titre="Par moyen"
                  sousTitre={`Dons en ligne ${enPeriode(data.periode)}, en FCFA · ordre fixe`}
                  entete="Moyen"
                  caption="Dons en ligne par moyen de paiement, en FCFA"
                  lignes={lignesMoyen(data.synthese.par_moyen)}
                  total={data.synthese.en_ligne}
                  pied={<p>Les pourcentages portent sur le total en ligne.</p>}
                />
                <CarteRepartition
                  titre="Par lieu de culte"
                  sousTitre={`Collecté ${enPeriode(data.periode)}, en FCFA`}
                  entete="Lieu"
                  caption="Collecté par lieu de culte, en FCFA"
                  lignes={lignesLieu(data.synthese.par_lieu ?? [])}
                  total={data.synthese.collecte}
                  pied={
                    (data.synthese.par_lieu ?? []).some(
                      (l) => l.lieu_id === null,
                    ) && (
                      <p>
                        Le lieu d&apos;un don en ligne n&apos;est pas encore
                        enregistré : il n&apos;est jamais réparti entre les
                        lieux.
                      </p>
                    )
                  }
                />
              </div>
              <TresorerieCarte data={data} />
              {(data.campagnes ?? []).map((c) => (
                <CarteCampagne
                  key={c.fonds_id}
                  c={c}
                  periodeLibelle={data.periode.libelle.replace(/\s\d{4}$/, '')}
                />
              ))}
            </>
          )}
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
