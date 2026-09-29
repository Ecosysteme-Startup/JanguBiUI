'use client';

import { Download } from 'lucide-react';
import * as React from 'react';

import { Link } from '@/components/ui/link/link';
import { StatusBadge } from '@/components/ui/status-badge';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-client';

import {
  type AnalyseParoisse,
  type Campagne,
  type FiltresAnalyse,
  type Granularite,
  type LigneRepartition,
  type TypeFonds,
  useAnalyseParoisse,
} from '../api/get-analyse-dons';
import { telechargerCsv, versCsv } from '../utils/export-csv';
import {
  capitaliser,
  formatDateLongue,
  formatDuree,
  formatFcfa,
  formatHorodatage,
  formatJourMois,
  formatMois,
  formatNombre,
  formatPourcent,
  formatSecondes,
  NBSP,
  partPourcent,
} from '../utils/format';
import {
  COULEUR_FONDS,
  LIBELLE_FONDS,
  ORDRE_FONDS,
  ordonnerParFonds,
  STATUTS_PAIEMENT,
} from '../utils/palette';
import { enPeriode } from '../utils/periode';

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
import { LigneTendance } from './graphiques/ligne-tendance';
import {
  type LigneTableauRepartition,
  TableauRepartition,
  TableauSimple,
} from './graphiques/tableau-repartition';
import { Onglets } from './onglets-dons';

const MOIS_COURANT = '2026-09';

const GRANULARITES: { valeur: Granularite; libelle: string }[] = [
  { valeur: 'semaine', libelle: 'Semaine' },
  { valeur: 'mois', libelle: 'Mois' },
  { valeur: 'trimestre', libelle: 'Trimestre' },
  { valeur: 'annee', libelle: 'Année' },
];

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
          <span
            key="l"
            className={l.niveau ? 'pl-4 text-foreground/80' : undefined}
          >
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

function Synthese({ data }: { data: AnalyseParoisse }) {
  const c = data.collecte;
  const fonds = ordonnerParFonds(data.par_fonds);
  const moisCourt = enPeriode(data.periode);
  return (
    <section
      aria-labelledby="titre-synthese"
      className="rounded-2xl border border-border bg-card px-6 py-5 shadow-soft-sm"
    >
      <h2 id="titre-synthese" className="sr-only">
        Synthèse
      </h2>
      <ChiffreTitre
        libelle={`Collecté ${moisCourt}`}
        horodatage={`au ${formatHorodatage(data.arrete_au)}`}
        valeur={formatNombre(c.total)}
        unite="FCFA"
      >
        collectés {moisCourt} à {data.lieu.nom}
        {c.pour_curie > 0 ? (
          <>
            , dont{' '}
            <strong className="font-semibold text-foreground">
              {formatNombre(c.pour_paroisse)}
            </strong>{' '}
            pour la paroisse et{' '}
            <strong className="font-semibold text-foreground">
              {formatNombre(c.pour_curie)}
            </strong>{' '}
            pour la quête impérée
            {c.quete_imperee_libelle ? ` du ${c.quete_imperee_libelle}` : ''}, à
            remettre à la curie.
          </>
        ) : (
          '.'
        )}
      </ChiffreTitre>
      {c.total === 0 ? (
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
              valeur: f.montant,
              couleur: COULEUR_FONDS[f.type],
            }))}
          />
          <TableauRepartition
            className="mt-4"
            caption={`Collecté ${moisCourt} par type de fonds, en FCFA`}
            entete={{ libelle: 'Type de fonds', valeur: 'Montant' }}
            barres={false}
            lignes={fonds.map((f) => ({
              cle: f.type,
              libelle: f.libelle,
              valeur: f.montant,
              couleur: COULEUR_FONDS[f.type],
            }))}
            total={c.total}
          />
          <p className="mt-3 text-[13px] leading-[18px] text-muted-foreground">
            En ligne : {formatNombre(c.en_ligne)} ({c.en_ligne_nombre} dons) ·
            espèces : {formatNombre(c.especes)} ({c.especes_quetes} quêtes
            validées).
            {c.a_confirmer &&
              ` Une quête de ${formatNombre(c.a_confirmer.montant)} attend sa confirmation et n'est pas comptée.`}
          </p>
        </>
      )}
    </section>
  );
}

function FluxParSemaine({ data }: { data: AnalyseParoisse }) {
  const series = ORDRE_FONDS.filter((t) =>
    data.par_semaine.some((s) => (s.valeurs[t] ?? 0) > 0),
  ).map((t) => ({
    cle: t,
    libelle: LIBELLE_FONDS[t],
    couleur: COULEUR_FONDS[t],
  }));
  const semaines = data.par_semaine;
  const resume = `Collecté par semaine : ${semaines
    .map((s) => `${s.libelle} ${formatFcfa(s.total)}`)
    .join(' ; ')}.`;
  return (
    <CarteGraphique
      titre="Flux par semaine"
      sousTitre={`Collecté par type de fonds, en milliers${NBSP}de FCFA · semaines terminées le dimanche`}
      graphique={
        semaines.length === 0 ? (
          <EtatVide />
        ) : (
          <ColonnesEmpilees
            resume={resume}
            diviseur={1000}
            series={series}
            periodes={semaines.map((s) => ({
              cle: s.debut,
              libelle: s.libelle,
              sousLibelle: s.sous_libelle,
              titreInfobulle: `Semaine du ${formatJourMois(s.debut).replace(/\s.*/, '')} au ${formatJourMois(s.fin)}`,
              valeurs: s.valeurs,
            }))}
          />
        )
      }
      tableau={
        <TableauSimple
          caption="Collecté par semaine et par type de fonds, en FCFA"
          colonnes={[
            { libelle: 'Semaine' },
            ...series.map((s) => ({
              libelle: s.libelle,
              alignement: 'droite' as const,
            })),
            { libelle: 'Total', alignement: 'droite' },
          ]}
          lignes={semaines.map((s) => ({
            cle: s.debut,
            cellules: [
              `${s.libelle} (${s.sous_libelle})`,
              ...series.map((x) =>
                formatNombre(s.valeurs[x.cle as TypeFonds] ?? 0),
              ),
              formatNombre(s.total),
            ],
          }))}
          pied={[
            'Total',
            ...series.map((x) =>
              formatNombre(
                semaines.reduce(
                  (t, s) => t + (s.valeurs[x.cle as TypeFonds] ?? 0),
                  0,
                ),
              ),
            ),
            formatNombre(semaines.reduce((t, s) => t + s.total, 0)),
          ]}
        />
      }
      pied={data.notes.par_semaine.map((n) => (
        <p key={n}>{n}</p>
      ))}
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

function PaiementsEnLigne({ data }: { data: AnalyseParoisse }) {
  const p = data.paiements;
  const statuts = STATUTS_PAIEMENT.map((s) => ({ ...s, valeur: p[s.cle] }));
  const taux = partPourcent(p.confirmes, p.lances);
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
            <p className="text-[15px] leading-6 text-foreground/80">
              <strong className="font-semibold text-foreground">
                {p.confirmes} des {p.lances} paiements
              </strong>{' '}
              lancés ont abouti ({formatPourcent(taux)}).
              {p.en_attente > 0 &&
                ` ${p.en_attente} ${p.en_attente > 1 ? 'sont' : 'est'} encore en attente${
                  p.plus_ancien_attente_depuis
                    ? `, le plus ancien depuis ${formatDuree(p.plus_ancien_attente_depuis, data.arrete_au, true)}`
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
        <div className="flex items-center justify-between gap-3">
          <span>
            {p.delai_median_s !== null &&
              `Délai de confirmation : médiane ${formatSecondes(p.delai_median_s)}`}
          </span>
          <Link
            href={paths.app.dons.getHref()}
            className="text-sm font-semibold text-primary"
          >
            Voir les opérations
          </Link>
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
      className={`flex h-9 items-center justify-between gap-3 border-t border-border text-sm first:border-t-0 ${
        forte ? 'font-semibold text-foreground' : 'text-foreground'
      }`}
    >
      <dt className={retrait ? 'pl-4 text-foreground/80' : undefined}>
        {libelle}
      </dt>
      <dd className="tabular-nums">{valeur}</dd>
    </div>
  );
}

function Tresorerie({ data }: { data: AnalyseParoisse }) {
  const t = data.tresorerie;
  const partReverse =
    t.net_en_ligne > 0 ? Math.round((t.reverse / t.net_en_ligne) * 100) : 0;
  return (
    <Carte
      titre="Trésorerie"
      sousTitre={`Où en est l'argent ${enPeriode(data.periode).replace(/^en /, 'de ')}, en FCFA · relevé, sans cascade`}
    >
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="text-[13px] font-medium text-muted-foreground">
            En ligne
          </h3>
          <dl className="mt-1">
            <LigneReleve
              libelle="Payé en ligne"
              valeur={formatNombre(t.paye_en_ligne)}
            />
            <LigneReleve
              libelle="Frais de paiement"
              valeur={formatNombre(-t.frais)}
            />
            <LigneReleve
              libelle="Net en ligne"
              valeur={formatNombre(t.net_en_ligne)}
              forte
            />
            <LigneReleve
              retrait
              libelle={`dont reversé à l'économat${t.reverse_le ? ` le ${formatJourMois(t.reverse_le)}` : ''}`}
              valeur={formatNombre(t.reverse)}
            />
            <LigneReleve
              retrait
              libelle="dont en attente de reversement"
              valeur={formatNombre(t.en_attente_reversement)}
            />
          </dl>
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[13px]">
              <span className="text-foreground">
                Reversement du net en ligne
              </span>
            </div>
            <Jauge
              titre="Reversement du net en ligne"
              pourcent={partReverse}
              libelle={`${formatPourcent(partReverse)} reversé`}
            />
          </div>
          <p className="mt-3 text-sm text-foreground/80">
            Pour 100 FCFA donnés en ligne, {t.net_pour_100} FCFA arrivent.{' '}
            {t.dons_frais_couverts} dons sur {data.collecte.en_ligne_nombre}{' '}
            couvrent les frais.
          </p>
        </div>
        <div>
          <h3 className="text-[13px] font-medium text-muted-foreground">
            Espèces
          </h3>
          <dl className="mt-1">
            <LigneReleve
              libelle="Quêtes validées"
              valeur={formatNombre(t.especes_validees)}
            />
            <LigneReleve
              retrait
              libelle="dont déposées à la banque"
              valeur={formatNombre(t.especes_deposees)}
            />
            <LigneReleve
              retrait
              libelle="dont en caisse"
              valeur={formatNombre(t.especes_en_caisse)}
            />
            <LigneReleve
              libelle="Quête à confirmer, non comptée"
              valeur={formatNombre(t.quete_a_confirmer)}
            />
          </dl>
        </div>
      </div>
    </Carte>
  );
}

const MOIS_CAMPAGNE = (c: Campagne) => {
  const liste: string[] = [];
  let m = c.debut.slice(0, 7);
  const fin = c.fin.slice(0, 7);
  while (m <= fin && liste.length < 24) {
    liste.push(m);
    const [a, mm] = m.split('-').map(Number);
    m = mm === 12 ? `${a + 1}-01` : `${a}-${String(mm + 1).padStart(2, '0')}`;
  }
  return liste;
};

function CarteCampagne({
  c,
  periodeLibelle,
}: {
  c: Campagne;
  periodeLibelle: string;
}) {
  const mois = MOIS_CAMPAGNE(c);
  const pourcent = c.objectif ? Math.round((c.reuni / c.objectif) * 100) : 0;
  const valeurs = mois.map(
    (m) => c.cumul.find((x) => x.mois === m)?.cumul ?? null,
  );
  const pourcentProjection =
    c.objectif && c.projection_fin
      ? Math.round((c.projection_fin / c.objectif) * 100)
      : null;
  return (
    <CarteGraphique
      titre={`Campagne : ${c.titre}`}
      sousTitre={`Du ${formatDateLongue(c.debut, false)} au ${formatDateLongue(c.fin)} · cumul en milliers${NBSP}de FCFA`}
      graphique={
        <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div>
            {c.objectif && (
              <Jauge
                position="droite"
                titre="Progression de la campagne"
                pourcent={pourcent}
                libelle={formatPourcent(pourcent)}
              />
            )}
            <p className="mt-3 text-[15px] leading-6 text-foreground/80">
              <strong className="font-semibold text-foreground">
                {formatFcfa(c.reuni)}
              </strong>{' '}
              réunis
              {c.objectif
                ? ` sur ${formatNombre(c.objectif)} (${formatPourcent(pourcent)})`
                : ''}
              , {c.nombre_dons} dons.
            </p>
            <p className="mt-2 text-sm text-foreground/80">
              {capitaliser(periodeLibelle)} : {formatFcfa(c.montant_periode)}.
              {c.rythme_hebdo && c.projection_fin
                ? ` Au rythme des quatre dernières semaines (${formatFcfa(c.rythme_hebdo)} par semaine), environ ${formatFcfa(c.projection_fin)} au ${formatDateLongue(c.fin, false)}${pourcentProjection !== null ? ` (${formatPourcent(pourcentProjection)})` : ''}.`
                : ''}
            </p>
          </div>
          <LigneTendance
            resume={`Cumul de la campagne : ${formatFcfa(c.reuni)}${c.objectif ? ` sur ${formatFcfa(c.objectif)}` : ''}.`}
            x={mois.map((m) => formatMois(m, true))}
            titresX={mois.map((m) => formatMois(m))}
            diviseur={1000}
            hauteur={180}
            margeDroite={24}
            series={[
              {
                cle: 'cumul',
                libelle: 'Cumul',
                couleur: 'var(--dv-ligne)',
                valeurs,
                aire: true,
                etiquetteFin: [formatNombre(c.reuni)],
              },
            ]}
            objectif={
              c.objectif
                ? {
                    valeur: c.objectif,
                    libelle: `Objectif ${formatNombre(c.objectif)}`,
                  }
                : undefined
            }
          />
        </div>
      }
      tableau={
        <TableauSimple
          caption={`Cumul de la campagne ${c.titre}, en FCFA`}
          colonnes={[
            { libelle: 'Mois' },
            { libelle: 'Cumul en fin de mois', alignement: 'droite' },
          ]}
          lignes={c.cumul.map((x) => ({
            cle: x.mois,
            cellules: [formatMois(x.mois), formatNombre(x.cumul)],
          }))}
          pied={c.objectif ? ['Objectif', formatNombre(c.objectif)] : undefined}
        />
      }
    />
  );
}

const exporter = (data: AnalyseParoisse) => {
  const rep = (l: LigneRepartition) => [l.libelle, l.nombre, l.montant];
  const csv = versCsv([
    {
      titre: `Collecté par type de fonds (${data.periode.libelle})`,
      lignes: [
        ['Type', 'Montant'],
        ...data.par_fonds.map((f) => [f.libelle, f.montant]),
      ],
    },
    {
      titre: 'Collecté par semaine',
      lignes: [
        ['Semaine', ...ORDRE_FONDS.map((t) => LIBELLE_FONDS[t]), 'Total'],
        ...data.par_semaine.map((s) => [
          s.libelle,
          ...ORDRE_FONDS.map((t) => s.valeurs[t] ?? 0),
          s.total,
        ]),
      ],
    },
    {
      titre: "Par canal d'entrée",
      lignes: [['Canal', 'Nombre', 'Montant'], ...data.par_canal.map(rep)],
    },
    {
      titre: 'Par moyen',
      lignes: [['Moyen', 'Nombre', 'Montant'], ...data.par_moyen.map(rep)],
    },
    {
      titre: 'Par lieu de culte',
      lignes: [['Lieu', 'Nombre', 'Montant'], ...data.par_lieu.map(rep)],
    },
  ]);
  telechargerCsv(`analyse-dons-${data.periode.debut.slice(0, 7)}.csv`, csv);
};

const OPTIONS_FONDS = [
  { valeur: '', libelle: 'Tous les fonds' },
  ...ORDRE_FONDS.map((t) => ({ valeur: t, libelle: LIBELLE_FONDS[t] })),
];
const OPTIONS_CANAUX = [
  { valeur: '', libelle: 'Tous les canaux' },
  { valeur: 'en_ligne', libelle: 'En ligne' },
  { valeur: 'especes', libelle: 'Espèces' },
];

export function AnalyseParoisseVue() {
  const [granularite, setGranularite] = React.useState<Granularite>('mois');
  const [mois, setMois] = React.useState(MOIS_COURANT);
  const [fonds, setFonds] = React.useState('');
  const [canal, setCanal] = React.useState('');
  const [lieu, setLieu] = React.useState('');

  const filtres: FiltresAnalyse = {
    granularite,
    date: mois,
    fonds: (fonds || undefined) as TypeFonds | undefined,
    canal: canal || undefined,
    lieu: lieu || undefined,
  };
  const { data, isLoading, error } = useAnalyseParoisse(filtres);

  const optionsLieux = [
    { valeur: '', libelle: 'Tous les lieux' },
    ...(data?.par_lieu ?? [])
      .filter((l) => !l.non_renseigne)
      .map((l) => ({ valeur: l.code, libelle: l.libelle })),
  ];

  return (
    <div className="space-y-6">
      <div>
        {data && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>
              {data.lieu.nom} · {data.periode.libelle} · chiffres au{' '}
              {formatHorodatage(data.arrete_au)}
            </span>
            {data.periode.en_cours && (
              <StatusBadge
                tone="progress"
                label={`${data.periode.granularite === 'mois' ? 'Mois' : 'Période'} en cours · chiffres provisoires`}
              />
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
              href: paths.app.dons.getHref(),
            },
            {
              cle: 'analyse',
              libelle: 'Analyse',
              href: paths.app.donsAnalyse.getHref(),
            },
          ]}
        />
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
            nom: 'Fonds',
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
            cle: 'lieu',
            nom: 'Lieu',
            valeur: lieu,
            options: optionsLieux,
            onChange: setLieu,
          },
        ]}
        fin={
          <button
            type="button"
            disabled={!data}
            onClick={() => data && exporter(data)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
          >
            <Download className="size-4" aria-hidden="true" />
            Exporter
          </button>
        }
      />

      {error ? (
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
          {data.collecte.total > 0 && (
            <>
              <FluxParSemaine data={data} />
              <div className="grid items-start gap-6 lg:grid-cols-2">
                <CarteRepartition
                  titre="Par canal d'entrée"
                  sousTitre={`Collecté ${enPeriode(data.periode)}, en FCFA`}
                  entete="Canal"
                  caption="Collecté par canal d'entrée, en FCFA"
                  lignes={data.par_canal}
                  total={data.collecte.total}
                  pied={
                    <p>
                      En ligne : {data.collecte.en_ligne_nombre} dons. Les
                      pourcentages portent sur le total collecté.
                    </p>
                  }
                />
                <PaiementsEnLigne data={data} />
              </div>
              <div className="grid items-start gap-6 lg:grid-cols-2">
                <CarteRepartition
                  titre="Par moyen"
                  sousTitre={`Collecté ${enPeriode(data.periode)}, en FCFA · ordre fixe`}
                  entete="Moyen"
                  caption="Collecté par moyen de paiement, en FCFA"
                  lignes={data.par_moyen}
                  total={data.collecte.total}
                />
                <CarteRepartition
                  titre="Par lieu de culte"
                  sousTitre={`Collecté ${enPeriode(data.periode)}, en FCFA`}
                  entete="Lieu"
                  caption="Collecté par lieu de culte, en FCFA"
                  lignes={data.par_lieu}
                  total={data.collecte.total}
                  pied={
                    data.par_lieu.some((l) => l.non_renseigne) && (
                      <p>
                        Le lieu d&apos;un don en ligne n&apos;est pas encore
                        enregistré : il n&apos;est jamais réparti entre les
                        lieux.
                      </p>
                    )
                  }
                />
              </div>
              <Tresorerie data={data} />
              {data.campagnes.map((c) => (
                <CarteCampagne
                  key={c.id}
                  c={c}
                  periodeLibelle={data.periode.libelle.replace(/\s\d{4}$/, '')}
                />
              ))}
            </>
          )}
          <p className="text-[13px] text-muted-foreground">
            Montants en FCFA. Aucun nom de donateur dans cette vue. Comparaison
            avec l&apos;an dernier disponible à partir de septembre 2027.
          </p>
        </>
      )}
    </div>
  );
}
