'use client';

import * as React from 'react';

import { StatusBadge, type StatusTone } from '@/components/ui/status-badge';
import { ApiError } from '@/lib/api-client';

import {
  type ActivitePlateforme,
  type FiltresPlateforme,
  type IncidentPaiement,
  useActivitePlateforme,
} from '../api/get-activite-plateforme';
import {
  capitaliser,
  formatDuree,
  formatHeure,
  formatHorodatage,
  formatJourLong,
  formatJourMois,
  formatJourSemaine,
  formatPourcent,
  formatSecondes,
  NBSP,
  partPourcent,
} from '../utils/format';
import { STATUTS_PAIEMENT } from '../utils/palette';

import { BarreFiltres } from './barre-filtres';
import { BarreDeFlux } from './graphiques/barre-de-flux';
import { Carte, CarteGraphique } from './graphiques/carte-graphique';
import { CarteThermique } from './graphiques/carte-thermique';
import { ChiffreTitre } from './graphiques/chiffre-titre';
import { ColonnesEmpilees } from './graphiques/colonnes-empilees';
import {
  EtatChargement,
  EtatErreur,
  EtatVide,
} from './graphiques/etats-graphique';
import { Pastille } from './graphiques/legende';
import { LigneTendance } from './graphiques/ligne-tendance';
import {
  TableauRepartition,
  TableauSimple,
} from './graphiques/tableau-repartition';

// Décision du 27/09 : la plateforme ne voit AUCUN montant, même agrégé.
// Cette vue n'affiche que des nombres, des taux et des délais ; le contrat
// d'API n'en transporte pas (schéma strict).

const MOIS_COURANT = '2026-09';
const nombre = (n: number) => String(n);

const ETATS_INCIDENT: Record<
  IncidentPaiement['etat'],
  { label: string; tone: StatusTone }
> = {
  en_attente: { label: 'En attente', tone: 'warning' },
  doublon: { label: 'Doublon ignoré', tone: 'neutral' },
  a_examiner: { label: 'À examiner', tone: 'danger' },
  resolu: { label: 'Résolu', tone: 'success' },
};

const ACTIONS_INCIDENT: Record<
  NonNullable<IncidentPaiement['action']>,
  string
> = {
  relancer: 'Relancer la vérification',
  acces_urgence: "Accès d'urgence journalisé",
};

function Synthese({ data }: { data: ActivitePlateforme }) {
  const p = data.paiements;
  const taux = partPourcent(p.confirmes, p.lances);
  const mois = data.periode.libelle.replace(/\s\d{4}$/, '');
  return (
    <section
      aria-labelledby="titre-synthese-pla"
      className="rounded-2xl border border-border bg-card px-6 py-5 shadow-soft-sm"
    >
      <h2 id="titre-synthese-pla" className="sr-only">
        Synthèse
      </h2>
      <ChiffreTitre
        libelle={`Paiements en ligne lancés en ${mois}`}
        avant={`Sur ${mois},`}
        valeur={String(taux)}
        unite="%"
      >
        des paiements lancés sont confirmés.
        {p.derniere_notification_le &&
          ` Dernière notification reçue il y a ${formatDuree(p.derniere_notification_le, data.arrete_au)}.`}
        {p.en_attente > 0 &&
          ` ${p.en_attente} paiement${p.en_attente > 1 ? 's' : ''} en attente${
            p.plus_ancien_attente_depuis
              ? `, le plus ancien depuis ${formatDuree(p.plus_ancien_attente_depuis, data.arrete_au)}`
              : ''
          }.`}
      </ChiffreTitre>
      <BarreDeFlux
        className="mt-4"
        titre={`Issue des ${p.lances} paiements lancés`}
        segments={STATUTS_PAIEMENT.map((s) => ({
          cle: s.cle,
          libelle: s.libelle,
          valeur: p[s.cle],
          couleur: s.couleur,
        }))}
      />
      <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {STATUTS_PAIEMENT.map((s) => (
          <div key={s.cle} className="border-t border-border pt-2">
            <dt className="flex items-center gap-1.5 text-sm text-foreground/80">
              <Pastille couleur={s.couleur} />
              {s.libelle}
            </dt>
            <dd className="text-sm tabular-nums">
              <span className="font-semibold text-foreground">{p[s.cle]}</span>
              <span className="text-muted-foreground">
                {' · '}
                {formatPourcent(partPourcent(p[s.cle], p.lances))}
              </span>
            </dd>
          </div>
        ))}
        <div className="border-t border-border pt-2">
          <dt className="text-sm text-foreground/80">Lancés</dt>
          <dd className="text-sm font-semibold tabular-nums text-foreground">
            {p.lances}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-[13px] text-muted-foreground">
        Les pourcentages sont calculés sur les paiements lancés. Un paiement en
        attente peut encore être confirmé ou expirer.
      </p>
    </section>
  );
}

function IssueParJour({ data }: { data: ActivitePlateforme }) {
  const jours = data.par_jour;
  const somme = (
    k: 'lances' | 'confirmes' | 'en_attente' | 'echoues' | 'expires',
  ) => jours.reduce((s, j) => s + j[k], 0);
  const partiel = jours.find((j) => j.partiel);
  const premier = jours[0];
  const dernier = jours[jours.length - 1];
  return (
    <CarteGraphique
      titre="Issue des paiements par jour"
      sousTitre={
        premier && dernier
          ? `${jours.length} derniers jours, du ${formatJourMois(premier.date).replace(/\s.*/, '')} au ${formatJourMois(dernier.date)} · part de chaque statut, en % des paiements lancés le jour même`
          : undefined
      }
      graphique={
        jours.length === 0 ? (
          <EtatVide titre="Aucun paiement lancé sur ces jours." />
        ) : (
          <ColonnesEmpilees
            mode="pourcent"
            etiquettes="aucune"
            formatValeur={nombre}
            resume={`Part des statuts par jour : ${jours
              .map(
                (j) =>
                  `${formatJourLong(j.date)}, ${j.lances} lancés, ${j.confirmes} confirmés`,
              )
              .join(' ; ')}.`}
            series={STATUTS_PAIEMENT.map((s) => ({
              cle: s.cle,
              libelle: s.libelle,
              couleur: s.couleur,
            }))}
            libelleTotal={(total, periode) => {
              const j = jours.find((x) => x.date === periode.cle);
              return `lancés · ${formatPourcent(partPourcent(j?.confirmes ?? 0, total))} confirmés`;
            }}
            periodes={jours.map((j) => ({
              cle: j.date,
              libelle: formatJourSemaine(j.date),
              sousLibelle: `${j.lances} lancé${j.lances > 1 ? 's' : ''}`,
              titreInfobulle: capitaliser(formatJourLong(j.date)),
              valeurs: {
                confirmes: j.confirmes,
                en_attente: j.en_attente,
                echoues: j.echoues,
                expires: j.expires,
              },
            }))}
          />
        )
      }
      tableau={
        <TableauSimple
          caption="Issue des paiements par jour, en nombre"
          colonnes={[
            { libelle: 'Jour' },
            { libelle: 'Lancés', alignement: 'droite' },
            ...STATUTS_PAIEMENT.map((s) => ({
              libelle: s.libelle,
              alignement: 'droite' as const,
            })),
            { libelle: 'Confirmés', alignement: 'droite' },
          ]}
          lignes={jours.map((j) => ({
            cle: j.date,
            cellules: [
              capitaliser(formatJourLong(j.date)),
              j.lances,
              ...STATUTS_PAIEMENT.map((s) => j[s.cle]),
              formatPourcent(partPourcent(j.confirmes, j.lances)),
            ],
          }))}
          pied={[
            'Total',
            somme('lances'),
            ...STATUTS_PAIEMENT.map((s) => somme(s.cle)),
            formatPourcent(partPourcent(somme('confirmes'), somme('lances'))),
          ]}
        />
      }
      pied={
        <p>
          Sur ces {jours.length} jours : {somme('lances')} paiements lancés,{' '}
          {somme('confirmes')} confirmés, {somme('en_attente')} en attente,{' '}
          {somme('echoues')} échoués, {somme('expires')} expirés.
          {partiel &&
            ` Le ${formatJourLong(partiel.date).replace(/\s\S+$/, '')} est compté jusqu'à ${formatHeure(data.arrete_au).replace(':', `${NBSP}h${NBSP}`)}.`}
        </p>
      }
    />
  );
}

function Delai({ data }: { data: ActivitePlateforme }) {
  const d = data.delai;
  const jours = d.par_jour;
  return (
    <CarteGraphique
      titre="Délai de confirmation"
      sousTitre="Du lancement à la notification finale · en secondes"
      graphique={
        <LigneTendance
          resume={`Délai de confirmation par jour : médiane de ${jours
            .map((j) => j.median_s ?? '—')
            .join(
              ', ',
            )} secondes ; 95e centile de ${jours.map((j) => j.p95_s ?? '—').join(', ')} secondes.`}
          x={jours.map((j) => String(Number(j.date.slice(8))))}
          titresX={jours.map((j) => capitaliser(formatJourLong(j.date)))}
          titreAxeX={data.periode.libelle.replace(/\s\d{4}$/, '')}
          hauteur={200}
          margeDroite={120}
          formatValeur={(n) => formatSecondes(n)}
          series={[
            {
              cle: 'median',
              libelle: 'Médiane',
              couleur: 'var(--dv-ligne)',
              valeurs: jours.map((j) => j.median_s),
              etiquetteFin:
                d.median_s !== null
                  ? ['médiane', formatSecondes(d.median_s)]
                  : undefined,
            },
            {
              cle: 'p95',
              libelle: '95ᵉ centile',
              couleur: 'var(--dv-comparaison)',
              comparaison: true,
              valeurs: jours.map((j) => j.p95_s),
              etiquetteFin:
                d.p95_s !== null
                  ? [
                      '95ᵉ centile',
                      `${d.p95_s}${NBSP}s · ${formatSecondes(d.p95_s)}`,
                    ]
                  : undefined,
            },
          ]}
        />
      }
      tableau={
        <TableauSimple
          caption="Délai de confirmation par jour, en secondes"
          colonnes={[
            { libelle: 'Jour' },
            { libelle: 'Médiane', alignement: 'droite' },
            { libelle: '95ᵉ centile', alignement: 'droite' },
          ]}
          lignes={jours.map((j) => ({
            cle: j.date,
            cellules: [
              capitaliser(formatJourLong(j.date)),
              j.median_s === null ? '—' : formatSecondes(j.median_s),
              j.p95_s === null ? '—' : formatSecondes(j.p95_s),
            ],
          }))}
        />
      }
      pied={
        <p className="text-sm text-foreground/80">
          {d.median_s !== null && d.p95_s !== null && (
            <>
              Sur {data.periode.libelle.replace(/\s\d{4}$/, '')} : médiane{' '}
              <strong className="font-semibold text-foreground">
                {formatSecondes(d.median_s)}
              </strong>
              , 95ᵉ centile{' '}
              <strong className="font-semibold text-foreground">
                {formatSecondes(d.p95_s)}
              </strong>
              .{' '}
            </>
          )}
          {d.note}
        </p>
      }
    />
  );
}

function Notifications({ data }: { data: ActivitePlateforme }) {
  const n = data.notifications;
  const jours = n.par_jour;
  const lignes: {
    libelle: string;
    valeur: number;
    etat?: { label: string; tone: StatusTone };
  }[] = [
    { libelle: 'Reçues', valeur: n.recues },
    {
      libelle: 'Traitées',
      valeur: n.traitees,
      etat: { label: 'Traitées', tone: 'success' },
    },
    {
      libelle: 'Doublons ignorés',
      valeur: n.doublons,
      etat: { label: 'Ignorés', tone: 'neutral' },
    },
    { libelle: 'Rejetées (signature)', valeur: n.rejetees },
    {
      libelle: 'Erreurs : montant incohérent',
      valeur: n.erreurs,
      etat: n.erreurs > 0 ? { label: 'À examiner', tone: 'danger' } : undefined,
    },
  ];
  return (
    <CarteGraphique
      titre="Notifications de l'agrégateur"
      sousTitre={
        jours.length
          ? `Reçues par jour, du ${formatJourMois(jours[0].date).replace(/\s.*/, '')} au ${formatJourMois(jours[jours.length - 1].date)}`
          : undefined
      }
      graphique={
        <>
          <ColonnesEmpilees
            hauteur={120}
            etiquettes="toutes"
            formatValeur={nombre}
            legende={false}
            resume={`Notifications reçues par jour : ${jours
              .map((j) => `${j.recues} le ${Number(j.date.slice(8))}`)
              .join(', ')}.`}
            series={[
              {
                cle: 'recues',
                libelle: 'Reçues',
                couleur: 'var(--dv-colonne)',
              },
            ]}
            libelleTotal={() => 'reçues'}
            periodes={jours.map((j) => ({
              cle: j.date,
              libelle: String(Number(j.date.slice(8))),
              titreInfobulle: capitaliser(formatJourLong(j.date)),
              valeurs: { recues: j.recues },
            }))}
          />
          <table className="mt-4 w-full border-collapse text-sm">
            <caption className="sr-only">
              Traitement des notifications, {jours.length} derniers jours
            </caption>
            <thead>
              <tr className="text-[13px] text-muted-foreground">
                <th scope="col" className="pb-1 text-left font-medium">
                  Sur {jours.length} jours
                </th>
                <th scope="col" className="pb-1 text-right font-medium">
                  Nombre
                </th>
                <th scope="col" className="pb-1 text-right font-medium">
                  État
                </th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.libelle} className="h-10 border-t border-border">
                  <th scope="row" className="text-left font-normal">
                    {l.libelle}
                  </th>
                  <td className="text-right font-semibold tabular-nums">
                    {l.valeur}
                  </td>
                  <td className="text-right">
                    {l.etat && (
                      <StatusBadge label={l.etat.label} tone={l.etat.tone} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      }
      tableau={
        <TableauSimple
          caption="Notifications reçues par jour"
          colonnes={[
            { libelle: 'Jour' },
            { libelle: 'Reçues', alignement: 'droite' },
          ]}
          lignes={jours.map((j) => ({
            cle: j.date,
            cellules: [capitaliser(formatJourLong(j.date)), j.recues],
          }))}
          pied={['Total', n.recues]}
        />
      }
    />
  );
}

function Charge({ data }: { data: ActivitePlateforme }) {
  const c = data.charge;
  const lignes = c.jours.map((j) => ({
    cle: j.date,
    libelle: formatJourSemaine(j.date),
    libelleLong: formatJourLong(j.date),
    heures: j.heures,
    enGras: new Date(`${j.date}T00:00:00Z`).getUTCDay() === 0,
  }));
  const max = Math.max(0, ...c.jours.flatMap((j) => j.heures));
  return (
    <CarteGraphique
      titre="Charge par jour et par heure"
      sousTitre={`Lancements de paiement et notifications reçues, par heure · ${c.total} événements`}
      graphique={
        <CarteThermique
          lignes={lignes}
          unite="événements par heure"
          resume={`Lancements et notifications par heure sur ${c.jours.length} jours, ${c.total} événements ; maximum ${max} en une heure.`}
        />
      }
      tableau={
        <TableauSimple
          caption="Événements par jour et par heure"
          colonnes={[
            { libelle: 'Jour' },
            ...Array.from({ length: 24 }, (_, h) => ({
              libelle: `${h}${NBSP}h`,
              alignement: 'droite' as const,
            })),
          ]}
          lignes={lignes.map((l) => ({
            cle: l.cle,
            cellules: [
              l.libelle,
              ...Array.from({ length: 24 }, (_, h) =>
                h < l.heures.length ? l.heures[h] : '',
              ),
            ],
          }))}
        />
      }
      pied={c.note && <p>{c.note}</p>}
    />
  );
}

function Sources({ data }: { data: ActivitePlateforme }) {
  const total = data.sources.reduce((s, x) => s + x.nombre, 0);
  return (
    <Carte
      titre="Sources des parcours"
      sousTitre={`Dons confirmés en ${data.periode.libelle.replace(/\s\d{4}$/, '')}, en nombre, par point de départ`}
    >
      <TableauRepartition
        className="mt-3"
        caption="Sources des parcours de don confirmés"
        entete={{ libelle: 'Source', valeur: 'Dons' }}
        formatValeur={nombre}
        lignes={data.sources.map((s) => ({
          cle: s.code,
          libelle: s.libelle,
          valeur: s.nombre,
        }))}
        total={total}
      />
      {data.retours_ios && (
        <p className="mt-3 text-sm text-foreground/80">
          {data.retours_ios.revenus} parcours iPhone sur{' '}
          {data.retours_ios.total} reviennent dans l&apos;app après le paiement.
        </p>
      )}
    </Carte>
  );
}

function ParoissesEnFonctionnement({ data }: { data: ActivitePlateforme }) {
  const pa = data.paroisses;
  const autres = pa.parametrees - pa.activees.length;
  const p = data.paiements;
  return (
    <Carte
      titre="Paroisses en fonctionnement"
      sousTitre={`Paiements en ligne activés : ${pa.activees.length} paroisse${pa.activees.length > 1 ? 's' : ''} sur ${pa.parametrees} paramétrées`}
    >
      <ul className="mt-3">
        {pa.activees.map((x) => (
          <li
            key={x.id}
            className="flex items-center justify-between gap-3 border-t border-border py-3"
          >
            <span>
              <span className="block text-[15px] font-semibold">{x.nom}</span>
              {x.derniere_confirmation_le && (
                <span className="block text-[13px] text-muted-foreground">
                  Dernière confirmation il y a{' '}
                  {formatDuree(
                    x.derniere_confirmation_le,
                    data.arrete_au,
                    true,
                  )}{' '}
                  · {formatHorodatage(x.derniere_confirmation_le)}
                </span>
              )}
            </span>
            <StatusBadge tone="success" label="Paiements activés" />
          </li>
        ))}
        {autres > 0 && (
          <li className="flex items-center justify-between gap-3 border-t border-border py-3">
            <span>
              <span className="block text-[15px] font-semibold">
                {autres} autre{autres > 1 ? 's' : ''} paroisse
                {autres > 1 ? 's' : ''}
              </span>
              <span className="block text-[13px] text-muted-foreground">
                En préparation, paiements non activés
              </span>
            </span>
            <StatusBadge tone="progress" label="En préparation" />
          </li>
        )}
      </ul>
      <dl className="grid grid-cols-2 gap-4 border-t border-border pt-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-foreground/80">Dernière notification</dt>
          <dd className="font-semibold tabular-nums">
            {p.derniere_notification_le
              ? `il y a ${formatDuree(p.derniere_notification_le, data.arrete_au, true)}`
              : '—'}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-foreground/80">En attente</dt>
          <dd className="font-semibold tabular-nums">
            {p.en_attente}
            {p.plus_ancien_attente_depuis &&
              ` · depuis ${formatDuree(p.plus_ancien_attente_depuis, data.arrete_au, true)}`}
          </dd>
        </div>
      </dl>
    </Carte>
  );
}

function Incidents({ data }: { data: ActivitePlateforme }) {
  const incidents = [...data.incidents].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  return (
    <section
      aria-labelledby="titre-incidents"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft-sm"
    >
      <div className="px-6 pb-3 pt-5">
        <h2
          id="titre-incidents"
          className="font-sans text-xl font-semibold leading-7 tracking-normal"
        >
          Incidents de paiement
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Référence du paiement et paroisse comme contexte technique, sans
          montant ni nom
        </p>
      </div>
      {incidents.length === 0 ? (
        <p className="px-6 pb-5 text-sm text-muted-foreground">
          Aucun incident sur la période.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Incidents de paiement, du plus récent au plus ancien
            </caption>
            <thead className="bg-background-surface text-[13px] text-muted-foreground">
              <tr className="h-10 border-y border-border">
                <th scope="col" className="pl-6 text-left font-medium">
                  Date
                </th>
                <th scope="col" className="text-left font-medium">
                  Référence
                </th>
                <th scope="col" className="text-left font-medium">
                  Contexte
                </th>
                <th scope="col" className="text-left font-medium">
                  Nature
                </th>
                <th scope="col" className="text-left font-medium">
                  État
                </th>
                <th scope="col" className="pr-6 text-right font-medium">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((i) => {
                const etat = ETATS_INCIDENT[i.etat];
                return (
                  <tr
                    key={i.id}
                    className="h-14 border-b border-border last:border-b-0"
                  >
                    <td className="whitespace-nowrap pl-6 tabular-nums">
                      {formatHorodatage(i.date).replace(',', '')}
                    </td>
                    <td className="whitespace-nowrap tabular-nums">
                      {i.reference ?? '—'}
                    </td>
                    <td>{i.contexte}</td>
                    <td className="max-w-[260px] py-2 pr-4">{i.nature}</td>
                    <td>
                      <StatusBadge label={etat.label} tone={etat.tone} />
                    </td>
                    <td className="pr-6 text-right text-sm font-semibold text-primary">
                      {i.action && ACTIONS_INCIDENT[i.action]}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const OPTIONS = {
  paroisses: [{ valeur: '', libelle: 'Toutes les paroisses' }],
  moyens: [
    { valeur: '', libelle: 'Tous les moyens' },
    { valeur: 'wave', libelle: 'Wave' },
    { valeur: 'orange_money', libelle: 'Orange Money' },
    { valeur: 'free_money', libelle: 'Free Money' },
    { valeur: 'carte', libelle: 'Carte' },
  ],
  sources: [
    { valeur: '', libelle: 'Toutes les sources' },
    { valeur: 'app_android', libelle: 'App Android' },
    { valeur: 'web', libelle: 'Site' },
    { valeur: 'app_ios', libelle: 'App iOS' },
  ],
};

export function SantePaiementsVue() {
  const [granularite, setGranularite] = React.useState<'semaine' | 'mois'>(
    'mois',
  );
  const [mois, setMois] = React.useState(MOIS_COURANT);
  const [paroisse, setParoisse] = React.useState('');
  const [moyen, setMoyen] = React.useState('');
  const [source, setSource] = React.useState('');
  const filtres: FiltresPlateforme = {
    granularite,
    date: mois,
    paroisse: paroisse || undefined,
    moyen: moyen || undefined,
    source: source || undefined,
  };
  const { data, isLoading, error } = useActivitePlateforme(filtres);
  const optionsParoisses = [
    ...OPTIONS.paroisses,
    ...(data?.paroisses.activees ?? []).map((p) => ({
      valeur: p.id,
      libelle: p.nom,
    })),
  ];

  return (
    <div className="space-y-6">
      <p className="text-[15px] text-muted-foreground">
        Nombres, taux et délais seulement : la plateforme ne voit aucun montant.
      </p>
      <BarreFiltres
        granularites={[
          { valeur: 'semaine', libelle: 'Semaine' },
          { valeur: 'mois', libelle: 'Mois' },
        ]}
        granularite={granularite}
        onGranularite={setGranularite}
        mois={mois}
        onMois={setMois}
        moisMax={MOIS_COURANT}
        filtres={[
          {
            cle: 'paroisse',
            nom: 'Paroisse',
            valeur: paroisse,
            options: optionsParoisses,
            onChange: setParoisse,
          },
          {
            cle: 'moyen',
            nom: 'Moyen',
            valeur: moyen,
            options: OPTIONS.moyens,
            onChange: setMoyen,
          },
          {
            cle: 'source',
            nom: 'Source',
            valeur: source,
            options: OPTIONS.sources,
            onChange: setSource,
          },
        ]}
        fin={
          data && (
            <span className="text-[13px] text-muted-foreground tabular-nums">
              {capitaliser(`au ${formatHorodatage(data.arrete_au)}`)}
            </span>
          )
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
          <Synthese data={data} />
          <IssueParJour data={data} />
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <Delai data={data} />
            <Notifications data={data} />
          </div>
          <Charge data={data} />
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <Sources data={data} />
            <ParoissesEnFonctionnement data={data} />
          </div>
          <Incidents data={data} />
          <p className="text-[13px] text-muted-foreground">
            Aucun montant n&apos;est affiché sur la plateforme : nombres, taux
            et délais seulement. Le contrôle d&apos;un montant incohérent se
            fait en accès d&apos;urgence, nominatif et journalisé.
          </p>
        </>
      )}
    </div>
  );
}
