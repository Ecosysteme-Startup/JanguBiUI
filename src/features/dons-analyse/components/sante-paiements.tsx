'use client';

import * as React from 'react';

import { Badge, type BadgeTone } from '@/components/ui/badge';
import { ApiError } from '@/lib/api-client';

import {
  type ActivitePlateforme,
  useActivitePlateforme,
} from '../api/get-activite-plateforme';
import type { Periode } from '../api/get-analyse-dons';
import {
  capitaliser,
  formatDuree,
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
import { codePeriode } from '../utils/periode';

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
import {
  TableauRepartition,
  TableauSimple,
} from './graphiques/tableau-repartition';

// Décision du 27/09 : la plateforme ne voit AUCUN montant, même agrégé.
// Cette vue n'affiche que des nombres, des taux et des délais ; le contrat
// d'API n'en transporte pas (schéma strict).

const MOIS_COURANT = '2026-09';
const nombre = (n: number) => String(n);
const TIRET = '—';

const PERIODES: { valeur: Periode; libelle: string }[] = [
  { valeur: 'semaine', libelle: 'Semaine' },
  { valeur: 'mois', libelle: 'Mois' },
  { valeur: 'trimestre', libelle: 'Trimestre' },
  { valeur: 'annee', libelle: 'Année' },
];

const TYPES_INCIDENT: Record<string, string> = {
  late_payment: 'Paiement réussi après expiration ou échec',
  amount_mismatch: 'Montant payé différent du montant attendu',
  invalid_signature: 'Notification à la signature invalide',
  unknown_reference: 'Notification pour une référence inconnue',
};

const STATUTS_INCIDENT: Record<string, { label: string; tone: BadgeTone }> = {
  ouvert: { label: 'À régulariser', tone: 'warn' },
  resolu: { label: 'Régularisé', tone: 'ok' },
};

// 1 = lundi … 7 = dimanche (contrat §3).
const JOURS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
const JOURS_LONGS = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
];

const sansAnnee = (libelle: string) => libelle.replace(/\s\d{4}$/, '');

function Synthese({ data }: { data: ActivitePlateforme }) {
  const p = data.paiements;
  const taux = p.taux_confirmation ?? partPourcent(p.confirmes, p.lances);
  const periode = sansAnnee(data.periode.libelle);
  const derniere = data.notifications.derniere_recue;
  return (
    <section
      aria-labelledby="titre-synthese-pla"
      className="rounded-16 border border-line bg-surface px-6 py-5 shadow-card"
    >
      <h2 id="titre-synthese-pla" className="sr-only">
        Synthèse
      </h2>
      <ChiffreTitre
        libelle={`Paiements en ligne lancés, ${periode}`}
        avant={`Sur ${periode},`}
        valeur={String(taux)}
        unite="%"
      >
        des paiements lancés sont confirmés.
        {derniere &&
          ` Dernière notification reçue il y a ${formatDuree(derniere, data.genere_le)}.`}
        {p.en_attente > 0 &&
          ` ${p.en_attente} paiement${p.en_attente > 1 ? 's' : ''} en attente${
            p.plus_ancien_en_attente
              ? `, le plus ancien depuis ${formatDuree(p.plus_ancien_en_attente, data.genere_le)}`
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
      <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-6">
        {STATUTS_PAIEMENT.map((s) => (
          <div key={s.cle} className="border-t border-line pt-2">
            <dt className="flex items-center gap-1.5 text-14 text-ink-2">
              <Pastille couleur={s.couleur} />
              {s.libelle}
            </dt>
            <dd className="text-14 tabular-nums">
              <span className="font-semibold text-ink">{p[s.cle]}</span>
              <span className="text-ink-3">
                {' · '}
                {formatPourcent(partPourcent(p[s.cle], p.lances))}
              </span>
            </dd>
          </div>
        ))}
        <div className="border-t border-line pt-2">
          <dt className="text-14 text-ink-2">Remboursés</dt>
          <dd className="text-14 font-semibold tabular-nums text-ink">
            {p.rembourses}
          </dd>
        </div>
        <div className="border-t border-line pt-2">
          <dt className="text-14 text-ink-2">Lancés</dt>
          <dd className="text-14 font-semibold tabular-nums text-ink">
            {p.lances}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-13 text-ink-3">
        Les pourcentages sont calculés sur les paiements lancés
        {p.taux_echec !== null &&
          ` ; échecs et expirations : ${formatPourcent(p.taux_echec)}`}
        . Un paiement en attente peut encore être confirmé ou expirer.
      </p>
    </section>
  );
}

function IssueParJour({ data }: { data: ActivitePlateforme }) {
  const jours = data.par_jour;
  const somme = (
    k: 'lances' | 'confirmes' | 'en_attente' | 'echoues' | 'expires',
  ) => jours.reduce((s, j) => s + j[k], 0);
  const premier = jours[0];
  const dernier = jours[jours.length - 1];
  return (
    <CarteGraphique
      titre="Issue des paiements par jour"
      sousTitre={
        premier && dernier
          ? `Du ${formatJourMois(premier.date).replace(/\s.*/, '')} au ${formatJourMois(dernier.date)} · part de chaque statut, en % des paiements lancés le jour même`
          : undefined
      }
      graphique={
        jours.length === 0 ? (
          <EtatVide titre="Aucun paiement lancé sur cette période." />
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
          Sur la période : {somme('lances')} paiements lancés,{' '}
          {somme('confirmes')} confirmés, {somme('en_attente')} en attente,{' '}
          {somme('echoues')} échoués, {somme('expires')} expirés.
        </p>
      }
    />
  );
}

function Releve({
  lignes,
}: {
  lignes: { libelle: string; valeur: React.ReactNode }[];
}) {
  return (
    <dl className="mt-3">
      {lignes.map((l) => (
        <div
          key={l.libelle}
          className="flex h-10 items-center justify-between gap-3 border-t border-line text-14"
        >
          <dt className="text-ink">{l.libelle}</dt>
          <dd className="font-semibold tabular-nums text-ink">{l.valeur}</dd>
        </div>
      ))}
    </dl>
  );
}

const jours = (n: number | null) =>
  n === null ? TIRET : `${n}${NBSP}jour${n > 1 ? 's' : ''}`;

function Delais({ data }: { data: ActivitePlateforme }) {
  const d = data.delais;
  return (
    <Carte
      titre="Délais"
      sousTitre={`Confirmation : du lancement à la notification finale, sur ${d.echantillon_confirmation} dons confirmés · reversement : reçus sur la période`}
    >
      <Releve
        lignes={[
          {
            libelle: 'Confirmation, médiane',
            valeur:
              d.confirmation_mediane_s === null
                ? TIRET
                : formatSecondes(d.confirmation_mediane_s),
          },
          {
            libelle: 'Confirmation, 95ᵉ centile',
            valeur:
              d.confirmation_p95_s === null
                ? TIRET
                : formatSecondes(d.confirmation_p95_s),
          },
          {
            libelle: 'Reversement, moyenne',
            valeur: jours(d.reversement_moyen_jours),
          },
          {
            libelle: 'Reversement, médiane',
            valeur: jours(d.reversement_median_jours),
          },
        ]}
      />
    </Carte>
  );
}

function Notifications({ data }: { data: ActivitePlateforme }) {
  const n = data.notifications;
  const lignes: {
    libelle: string;
    valeur: number;
    etat?: { label: string; tone: BadgeTone };
  }[] = [
    { libelle: 'Reçues', valeur: n.recues },
    {
      libelle: 'Traitées',
      valeur: n.traitees,
      etat: { label: 'Traitées', tone: 'ok' },
    },
    {
      libelle: 'Doublons ignorés',
      valeur: n.doublons,
      etat: { label: 'Ignorés', tone: 'neutral' },
    },
    { libelle: 'Rejetées (signature)', valeur: n.rejetees },
    {
      libelle: 'Erreurs',
      valeur: n.erreurs,
      etat: n.erreurs > 0 ? { label: 'À examiner', tone: 'err' } : undefined,
    },
    { libelle: 'En cours', valeur: n.en_cours },
  ];
  return (
    <Carte
      titre="Notifications de l'agrégateur"
      sousTitre={
        n.derniere_recue
          ? `Reçues sur la période · dernière le ${formatHorodatage(n.derniere_recue)}`
          : 'Reçues sur la période'
      }
    >
      <table className="mt-3 w-full border-collapse text-14">
        <caption className="sr-only">
          Traitement des notifications de l&apos;agrégateur, en nombre
        </caption>
        <thead>
          <tr className="text-13 text-ink-3">
            <th scope="col" className="pb-1 text-left font-medium">
              Notifications
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
            <tr key={l.libelle} className="h-10 border-t border-line">
              <th scope="row" className="text-left font-normal">
                {l.libelle}
              </th>
              <td className="text-right font-semibold tabular-nums">
                {l.valeur}
              </td>
              <td className="text-right">
                {l.etat && <Badge tone={l.etat.tone}>{l.etat.label}</Badge>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Carte>
  );
}

/** Grille 7 × 24 (lundi à dimanche) à partir des cases non nulles. */
export const grilleCharge = (
  charge: ActivitePlateforme['charge'],
): number[][] => {
  const grille = JOURS.map(() => Array.from({ length: 24 }, () => 0));
  charge.forEach((c) => {
    grille[c.jour_semaine - 1][c.heure] += c.nombre;
  });
  return grille;
};

function Charge({ data }: { data: ActivitePlateforme }) {
  const grille = grilleCharge(data.charge);
  const total = data.charge.reduce((s, c) => s + c.nombre, 0);
  const max = Math.max(0, ...grille.flat());
  const lignes = grille.map((heures, i) => ({
    cle: String(i + 1),
    libelle: JOURS[i],
    libelleLong: JOURS_LONGS[i],
    heures,
    enGras: i === 6,
  }));
  return (
    <CarteGraphique
      titre="Charge par jour et par heure"
      sousTitre={`Paiements lancés, par jour de la semaine et par heure de Dakar · ${total} paiements`}
      graphique={
        total === 0 ? (
          <EtatVide titre="Aucun paiement lancé sur cette période." />
        ) : (
          <CarteThermique
            lignes={lignes}
            unite="paiements lancés par heure"
            resume={`Paiements lancés par jour de la semaine et par heure, ${total} au total ; maximum ${max} sur une même case.`}
          />
        )
      }
      tableau={
        <TableauSimple
          caption="Paiements lancés par jour de la semaine et par heure"
          colonnes={[
            { libelle: 'Jour' },
            ...Array.from({ length: 24 }, (_, h) => ({
              libelle: `${h}${NBSP}h`,
              alignement: 'droite' as const,
            })),
          ]}
          lignes={lignes.map((l) => ({
            cle: l.cle,
            cellules: [capitaliser(l.libelleLong), ...l.heures],
          }))}
        />
      }
    />
  );
}

function SourcesEtMoyens({ data }: { data: ActivitePlateforme }) {
  const total = data.par_source.reduce((s, x) => s + x.confirmes, 0);
  const periode = sansAnnee(data.periode.libelle);
  return (
    <Carte
      titre="Sources et moyens"
      sousTitre={`Dons confirmés, ${periode}, en nombre, par point de départ et par moyen`}
    >
      <TableauRepartition
        className="mt-3"
        caption="Dons confirmés par source du parcours"
        entete={{ libelle: 'Source', valeur: 'Confirmés' }}
        formatValeur={nombre}
        lignes={data.par_source.map((s) => ({
          cle: s.source,
          libelle: s.libelle,
          complement:
            s.taux_confirmation === null
              ? null
              : `${s.lances} lancés · ${formatPourcent(s.taux_confirmation)}`,
          valeur: s.confirmes,
        }))}
        total={total}
      />
      {data.par_source
        .filter((s) => s.taux_retour !== null && s.lances > 0)
        .map((s) => (
          <p key={s.source} className="mt-2 text-14 text-ink-2">
            {s.libelle} : {s.retours} parcours sur {s.lances} reviennent sur la
            page de statut après le paiement.
          </p>
        ))}
      <TableauSimple
        caption="Confirmés et échecs par moyen de paiement"
        colonnes={[
          { libelle: 'Moyen' },
          { libelle: 'Confirmés', alignement: 'droite' },
          { libelle: 'Échecs', alignement: 'droite' },
          { libelle: "Taux d'échec", alignement: 'droite' },
        ]}
        lignes={data.par_moyen.map((m) => ({
          cle: m.moyen,
          cellules: [
            m.libelle,
            m.confirmes,
            m.echecs,
            m.taux_echec === null ? TIRET : formatPourcent(m.taux_echec),
          ],
        }))}
      />
      <p className="mt-2 text-13 text-ink-3">
        Le moyen n&apos;est souvent connu qu&apos;à la confirmation : les échecs
        sans moyen sont comptés en « Inconnu ».
      </p>
    </Carte>
  );
}

function Paroisses({ data }: { data: ActivitePlateforme }) {
  const ouvertes = data.par_paroisse.filter((p) => p.collecte_ouverte).length;
  const r = data.reversements;
  return (
    <Carte
      titre="Paroisses en fonctionnement"
      sousTitre={`Collecte ouverte : ${ouvertes} paroisse${ouvertes > 1 ? 's' : ''} sur ${data.par_paroisse.length} engagées · ordre alphabétique`}
    >
      <ul className="mt-3">
        {data.par_paroisse.map((x) => (
          <li
            key={x.id}
            data-paroisse={x.nom}
            className="flex items-center justify-between gap-3 border-t border-line py-3"
          >
            <span>
              <span className="block text-15 font-semibold">{x.nom}</span>
              <span className="block text-13 text-ink-3">
                {x.lances} lancés · {x.confirmes} confirmés
                {x.taux_confirmation !== null &&
                  ` (${formatPourcent(x.taux_confirmation)})`}{' '}
                · {x.quetes_saisies} quêtes saisies
                {x.derniere_confirmation &&
                  ` · dernière confirmation il y a ${formatDuree(x.derniere_confirmation, data.genere_le, true)}`}
              </span>
            </span>
            {x.collecte_ouverte ? (
              <Badge tone="ok">Collecte ouverte</Badge>
            ) : (
              <Badge tone="info">En préparation</Badge>
            )}
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-2 gap-4 border-t border-line pt-3 text-14">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-ink-2">Reversements à rapprocher</dt>
          <dd className="font-semibold tabular-nums">{r.a_rapprocher}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-ink-2">En écart</dt>
          <dd className="font-semibold tabular-nums">{r.en_ecart}</dd>
        </div>
      </dl>
    </Carte>
  );
}

function Incidents({ data }: { data: ActivitePlateforme }) {
  const incidents = data.incidents.liste;
  return (
    <section
      aria-labelledby="titre-incidents"
      className="overflow-hidden rounded-16 border border-line bg-surface shadow-card"
    >
      <div className="px-6 pb-3 pt-5">
        <h2
          id="titre-incidents"
          className="font-sans text-20 font-semibold leading-7"
        >
          Incidents de paiement
        </h2>
        <p className="mt-0.5 text-14 text-ink-3">
          {data.incidents.ouverts} ouvert
          {data.incidents.ouverts > 1 ? 's' : ''} · référence du paiement et
          paroisse comme contexte technique, sans montant ni nom
        </p>
      </div>
      {incidents.length === 0 ? (
        <p className="px-6 pb-5 text-14 text-ink-3">Aucun incident ouvert.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-14">
            <caption className="sr-only">
              Incidents de paiement ouverts, du plus récent au plus ancien
            </caption>
            <thead className="bg-surface text-13 text-ink-3">
              <tr className="h-10 border-y border-line">
                <th scope="col" className="pl-6 text-left font-medium">
                  Détecté le
                </th>
                <th scope="col" className="text-left font-medium">
                  Référence
                </th>
                <th scope="col" className="text-left font-medium">
                  Paroisse
                </th>
                <th scope="col" className="text-left font-medium">
                  Nature
                </th>
                <th scope="col" className="pr-6 text-left font-medium">
                  État
                </th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((i) => {
                const etat = STATUTS_INCIDENT[i.statut] ?? {
                  label: i.statut,
                  tone: 'neutral' as BadgeTone,
                };
                return (
                  <tr
                    key={`${i.reference}-${i.detecte_le}`}
                    className="h-14 border-b border-line last:border-b-0"
                  >
                    <td className="whitespace-nowrap pl-6 tabular-nums">
                      {formatHorodatage(i.detecte_le).replace(',', '')}
                    </td>
                    <td className="whitespace-nowrap tabular-nums">
                      {i.reference}
                    </td>
                    <td>{i.paroisse ?? TIRET}</td>
                    <td className="max-w-[280px] py-2 pr-4">
                      {TYPES_INCIDENT[i.type] ?? i.type}
                    </td>
                    <td className="pr-6">
                      <Badge tone={etat.tone}>{etat.label}</Badge>
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

export function SantePaiementsVue() {
  const [periode, setPeriode] = React.useState<Periode>('mois');
  const [mois, setMois] = React.useState(MOIS_COURANT);
  const { data, isLoading, error } = useActivitePlateforme({
    periode,
    date: codePeriode(periode, mois, MOIS_COURANT),
  });

  return (
    <div className="space-y-6">
      <p className="text-15 text-ink-3">
        Nombres, taux et délais seulement : la plateforme ne voit aucun montant.
      </p>
      <BarreFiltres
        granularites={PERIODES}
        granularite={periode}
        onGranularite={setPeriode}
        mois={mois}
        onMois={setMois}
        moisMax={MOIS_COURANT}
        filtres={[]}
        fin={
          data && (
            <span className="text-13 text-ink-3 tabular-nums">
              {capitaliser(`au ${formatHorodatage(data.genere_le)}`)}
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
            <Delais data={data} />
            <Notifications data={data} />
          </div>
          <Charge data={data} />
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <SourcesEtMoyens data={data} />
            <Paroisses data={data} />
          </div>
          <Incidents data={data} />
          <p className="text-13 text-ink-3">
            Aucun montant n&apos;est affiché sur la plateforme : nombres, taux
            et délais seulement. Le contrôle d&apos;un montant incohérent se
            fait en accès d&apos;urgence, nominatif et journalisé.
          </p>
        </>
      )}
    </div>
  );
}
