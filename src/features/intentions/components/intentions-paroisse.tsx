'use client';

import Link from 'next/link';
import { useId, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Icon } from '@/components/ui/icon';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-client';
import { useContexts } from '@/lib/can';

/** Paroisse de l'espace (`/espace/[nodeId]`). */
type NoeudStaff = { id: string; name: string };

import {
  heureCourte,
  jourSemaineApi,
  LIBELLES_SOURCE_PLAFOND,
  LIBELLES_TYPE_INTENTION,
  type MesseDuJour,
  PLAFOND_MAX,
  PLAFOND_MIN,
  type StaffMassIntention,
  useCelebrerIntention,
  useFixerPlafondMesse,
  useIntentionsParoisse,
  useMessesDuJour,
  useModifierReglages,
  usePlanifierIntention,
  useRefuserIntention,
  useReglagesIntentions,
  useRetirerPlafondMesse,
} from '../api/intentions';
import {
  aujourdhuiIso,
  jourCourt,
  jourLong,
  PAS_DE_DATE,
  placesRestantes,
} from '../utils/format';

import { IntentionStatusBadge } from './intention-status-badge';

const champ =
  'w-full rounded-md border border-line-field bg-paper px-3 py-2 text-14';

const MOTIFS_TYPES = [
  'Messe demandée déjà complète',
  'Pas de messe à cette date',
  'Texte à reformuler',
];

const messageErreur = (e: unknown) => {
  if (e instanceof ApiError) {
    if (e.code === 'mass_full')
      return 'Cette messe a déjà toutes ses intentions. Choisissez une autre messe.';
    if (e.code === 'max_invalid')
      return `Le nombre d’intentions par messe va de ${PLAFOND_MIN} à ${PLAFOND_MAX}.`;
    if (e.code === 'place_outside')
      return 'Ce lieu n’appartient pas à la paroisse.';
    if (e.code === 'weekday_or_date' || e.code === 'weekday_invalid')
      return 'Choisissez « ce jour seulement » ou « chaque semaine ».';
    if (e.code === 'place_required')
      return 'Indiquez le lieu de la messe pour la planifier à cette heure.';
    return e.message;
  }
  return 'L’opération n’a pas abouti.';
};

/** « 3 places restantes », ou « sans plafond ». */
const resteMesse = (m: MesseDuJour) =>
  m.remaining === null ? 'sans plafond' : placesRestantes(m.remaining);

/** « 2 / 5 intentions », ou « 2 intentions » sans plafond. */
const compteMesse = (m: MesseDuJour) => {
  const n = m.intentions_count;
  if (m.max_intentions === null)
    return n > 1 ? `${n} intentions` : `${n} intention`;
  return `${n} / ${m.max_intentions} intentions`;
};

/** Valeur du choix « autre messe » : planification sans heure précise. */
const SANS_HEURE = '';

const recue = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

function PanneauDecision({
  intention,
  onFermer,
}: {
  intention: StaffMassIntention;
  onFermer: () => void;
}) {
  const id = useId();
  const [date, setDate] = useState(
    intention.scheduled_date ?? intention.requested_date ?? '',
  );
  const [messe, setMesse] = useState(
    intention.scheduled_mass || intention.requested_mass,
  );
  const [heure, setHeure] = useState(
    intention.scheduled_time
      ? heureCourte(intention.scheduled_time)
      : SANS_HEURE,
  );
  const { data: jour } = useMessesDuJour(intention.parish.id, date);
  const messeChoisie = jour?.masses.find(
    (m) => heureCourte(m.start_time) === heure,
  );
  const [motif, setMotif] = useState(MOTIFS_TYPES[0]);
  const [message, setMessage] = useState('');
  const planifier = usePlanifierIntention();
  const refuser = useRefuserIntention();
  const celebrer = useCelebrerIntention();
  const erreur = planifier.error ?? refuser.error ?? celebrer.error;
  const passee =
    !!intention.scheduled_date && intention.scheduled_date <= aujourdhuiIso();

  return (
    <aside
      aria-label="Intention sélectionnée"
      className="space-y-4 rounded-xl border border-line bg-surface p-4"
    >
      <div className="space-y-1">
        <p className="text-13 text-ink-3">
          {intention.requester_name}
          {intention.is_anonymous && ' · anonyme à la messe'}
        </p>
        <p className="text-14 font-medium">{intention.intention}</p>
        <p className="text-13 text-ink-3">
          {LIBELLES_TYPE_INTENTION[intention.kind] ?? intention.kind} ·
          Souhaitée :{' '}
          {intention.requested_date
            ? `${jourLong(intention.requested_date)}${intention.requested_mass ? `, ${intention.requested_mass}` : ''}`
            : PAS_DE_DATE}
        </p>
        <p className="text-13 text-ink-3">
          Annoncée à la messe : {intention.announced_as}
        </p>
      </div>

      {(intention.status === 'recue' || intention.status === 'planifiee') && (
        <form
          className="space-y-3"
          aria-label="Planifier"
          onSubmit={(e) => {
            e.preventDefault();
            planifier.mutate(
              {
                id: intention.id,
                scheduled_date: date,
                ...(messeChoisie
                  ? {
                      scheduled_time: heure,
                      place_id: messeChoisie.place_id,
                      scheduled_mass: messeChoisie.label,
                    }
                  : { scheduled_mass: messe.trim() }),
              },
              { onSuccess: onFermer },
            );
          }}
        >
          <h3 className="text-14 font-semibold">
            {intention.status === 'planifiee'
              ? 'Déplacer'
              : 'Planifier à la messe'}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor={`${id}-date`} className="text-13 font-medium">
                Date
              </label>
              <input
                id={`${id}-date`}
                type="date"
                required
                min={aujourdhuiIso()}
                className={champ}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor={`${id}-heure`} className="text-13 font-medium">
                Messe
              </label>
              <select
                id={`${id}-heure`}
                className={champ}
                value={heure}
                onChange={(e) => setHeure(e.target.value)}
              >
                {jour?.masses.map((m) => {
                  const h = heureCourte(m.start_time);
                  // La messe déjà choisie reste sélectionnable (déplacement).
                  const pleine =
                    m.is_full &&
                    heureCourte(intention.scheduled_time ?? '') !== h;
                  return (
                    <option
                      key={`${m.place_id}-${h}`}
                      value={h}
                      disabled={pleine}
                    >
                      {`${m.label || h} · ${pleine ? 'complète' : resteMesse(m)}`}
                    </option>
                  );
                })}
                <option value={SANS_HEURE}>Autre messe, sans heure</option>
              </select>
            </div>
          </div>
          {!messeChoisie && (
            <div className="space-y-1">
              <label htmlFor={`${id}-messe`} className="text-13 font-medium">
                Précision (facultatif)
              </label>
              <input
                id={`${id}-messe`}
                maxLength={120}
                placeholder="Messe des jeunes"
                className={champ}
                value={messe}
                onChange={(e) => setMesse(e.target.value)}
              />
            </div>
          )}
          <Button type="submit" size="sm" block loading={planifier.isPending}>
            {date
              ? `Planifier le ${jourCourt(date)}${(messeChoisie?.label ?? messe.trim()) ? `, ${messeChoisie?.label ?? messe.trim()}` : ''}`
              : 'Planifier'}
          </Button>
        </form>
      )}

      {intention.status === 'planifiee' && (
        <Button
          size="sm"
          variant="outline"
          block
          disabled={!passee}
          loading={celebrer.isPending}
          onClick={() =>
            celebrer.mutate({ id: intention.id }, { onSuccess: onFermer })
          }
        >
          {passee ? 'Marquer célébrée' : 'Célébrée après la messe'}
        </Button>
      )}

      {intention.status === 'recue' && (
        <form
          className="space-y-2 border-t border-line pt-3"
          aria-label="Refuser"
          onSubmit={(e) => {
            e.preventDefault();
            const reason = [motif, message.trim()].filter(Boolean).join('. ');
            refuser.mutate(
              { id: intention.id, reason },
              { onSuccess: onFermer },
            );
          }}
        >
          <h3 className="text-14 font-semibold">Refuser avec un motif</h3>
          <label htmlFor={`${id}-motif`} className="sr-only">
            Motif
          </label>
          <select
            id={`${id}-motif`}
            className={champ}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
          >
            {MOTIFS_TYPES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <label htmlFor={`${id}-message`} className="text-13 font-medium">
            Message au demandeur (facultatif)
          </label>
          <textarea
            id={`${id}-message`}
            rows={2}
            maxLength={200}
            className={champ}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="text-13 text-ink-3">
            Le motif est envoyé au demandeur, qui peut choisir une autre messe.
          </p>
          <Button
            type="submit"
            size="sm"
            variant="outline"
            loading={refuser.isPending}
          >
            Refuser
          </Button>
        </form>
      )}

      {erreur && (
        <p role="alert" className="text-14 text-err">
          {messageErreur(erreur)}
        </p>
      )}
      <Button size="sm" variant="ghost" onClick={onFermer}>
        Fermer
      </Button>
    </aside>
  );
}

function Liste({ noeud }: { noeud: NoeudStaff }) {
  const [statut, setStatut] = useState('recue');
  const [choisie, setChoisie] = useState<StaffMassIntention | null>(null);
  const { data, isLoading, isError, refetch } = useIntentionsParoisse({
    node: noeud.id,
    status: statut,
  });

  const colonnes: DataTableColumn<StaffMassIntention>[] = [
    {
      header: 'Demandeur',
      cell: (i) => (
        <div className="space-y-1">
          <span className="block font-medium">{i.requester_name}</span>
          {i.is_anonymous && <Badge tone="muted">Anonyme à la messe</Badge>}
        </div>
      ),
    },
    {
      header: 'Intention',
      cell: (i) => <span className="line-clamp-2">{i.intention}</span>,
    },
    {
      header: statut === 'recue' ? 'Souhaitée' : 'Messe',
      cell: (i) => {
        const d = statut === 'recue' ? i.requested_date : i.scheduled_date;
        const m = statut === 'recue' ? i.requested_mass : i.scheduled_mass;
        return `${d ? jourCourt(d) : PAS_DE_DATE}${m ? `, ${m}` : ''}`;
      },
    },
    { header: 'Reçue', cell: (i) => recue(i.created_at), hideOnMobile: true },
    {
      header: 'Statut',
      cell: (i) => <IntentionStatusBadge status={i.status} />,
      hideOnMobile: true,
    },
    {
      header: 'Actions',
      isAction: true,
      cell: (i) =>
        i.status === 'recue' || i.status === 'planifiee' ? (
          <Button size="sm" variant="outline" onClick={() => setChoisie(i)}>
            {i.status === 'recue' ? 'Traiter' : 'Ouvrir'}
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <SegmentedControl
        label="Filtrer par statut"
        options={[
          ['recue', 'À planifier'],
          ['planifiee', 'Planifiées'],
          ['refusee', 'Refusées'],
          ['celebree', 'Célébrées'],
        ]}
        value={statut}
        onChange={(v) => {
          setStatut(v);
          setChoisie(null);
        }}
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          {isLoading && <LoadingBlock />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {data && (
            <DataTable
              data={data.results}
              columns={colonnes}
              rowKey={(i) => i.id}
              caption={`Intentions de messe de ${noeud.name}`}
              emptyState={
                <EmptyState icon="boite" title="Aucune intention">
                  Rien à afficher pour ce filtre.
                </EmptyState>
              }
            />
          )}
        </div>
        <div className="space-y-3">
          {choisie && (
            <PanneauDecision
              key={choisie.id}
              intention={choisie}
              onFermer={() => setChoisie(null)}
            />
          )}
          <p className="flex gap-2 rounded-lg bg-surface-2 p-3 text-13 text-ink-3">
            <Icon name="info" className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Aucun montant ni paiement n’est géré ici. L’offrande éventuelle se
            remet au secrétariat, comme d’habitude.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Messes d'un jour : intentions planifiées sur le plafond, lien vers la feuille. */
function MessesDuJour({ noeud }: { noeud: NoeudStaff }) {
  const id = useId();
  const [date, setDate] = useState(aujourdhuiIso());
  const { data, isLoading, isError, refetch } = useMessesDuJour(noeud.id, date);

  return (
    <section
      aria-labelledby={`${id}-titre`}
      className="space-y-3 rounded-xl border border-line bg-surface p-4"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 id={`${id}-titre`} className="text-14 font-semibold">
            Messes du jour
          </h2>
          <label htmlFor={`${id}-date`} className="sr-only">
            Jour
          </label>
          <input
            id={`${id}-date`}
            type="date"
            className={champ}
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={paths.espace.intentions.feuille.getHref(noeud.id, date)}>
            <Icon name="imprimer" className="size-4" aria-hidden="true" />
            Feuille à imprimer
          </Link>
        </Button>
      </div>
      {isLoading && <LoadingBlock />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {data && data.masses.length === 0 && (
        <p className="text-14 text-ink-3">
          Aucune messe prévue ce jour dans les horaires.
        </p>
      )}
      {data && data.masses.length > 0 && (
        <ul className="divide-y divide-line">
          {data.masses.map((m) => (
            <MesseLigne
              key={`${m.place_id}-${m.start_time}`}
              messe={m}
              noeud={noeud}
              date={date}
            />
          ))}
        </ul>
      )}
      {data && data.without_time_count > 0 && (
        <p className="text-13 text-ink-3">
          {data.without_time_count === 1
            ? '1 intention planifiée ce jour sans heure précise.'
            : `${data.without_time_count} intentions planifiées ce jour sans heure précise.`}
        </p>
      )}
    </section>
  );
}

/** Une messe du jour : compte, source du plafond, plafond propre. */
function MesseLigne({
  messe: m,
  noeud,
  date,
}: {
  messe: MesseDuJour;
  noeud: NoeudStaff;
  date: string;
}) {
  const id = useId();
  const [ouvert, setOuvert] = useState(false);
  const [portee, setPortee] = useState<'jour' | 'semaine'>('jour');
  const [sansPlafond, setSansPlafond] = useState(m.max_intentions === null);
  const [valeur, setValeur] = useState(String(m.max_intentions ?? ''));
  const fixer = useFixerPlafondMesse();
  const retirer = useRetirerPlafondMesse();
  const nom = m.label || heureCourte(m.start_time);
  const base = {
    node: noeud.id,
    place_id: m.place_id,
    start_time: heureCourte(m.start_time),
  };
  const erreur = fixer.error ?? retirer.error;

  return (
    <li className="space-y-2 py-2 text-14">
      <div className="flex items-center justify-between gap-3">
        <span>
          <span className="font-medium">{nom}</span>
          <span className="block text-13 text-ink-3">{m.place_name}</span>
        </span>
        <span className="text-right text-13">
          {compteMesse(m)}
          <span className="block text-ink-3">
            {m.is_full ? 'Complète' : resteMesse(m)}
          </span>
          <span className="block text-ink-3">
            {LIBELLES_SOURCE_PLAFOND[m.cap_source]}
          </span>
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-expanded={ouvert}
          onClick={() => setOuvert((o) => !o)}
        >
          {`Plafond de ${nom}`}
        </Button>
        {m.cap_source !== 'paroisse' && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            loading={retirer.isPending}
            onClick={() =>
              retirer.mutate(
                m.cap_source === 'date'
                  ? { ...base, date }
                  : { ...base, weekday: jourSemaineApi(date) },
              )
            }
          >
            Retirer ce plafond
          </Button>
        )}
      </div>
      {ouvert && (
        <form
          aria-label={`Plafond propre de ${nom}`}
          className="space-y-2 rounded-md border border-line p-3"
          onSubmit={(e) => {
            e.preventDefault();
            let max: number | null = null;
            if (!sansPlafond) {
              max = Number(valeur);
              if (
                !Number.isInteger(max) ||
                max < PLAFOND_MIN ||
                max > PLAFOND_MAX
              )
                return;
            }
            fixer.mutate(
              portee === 'jour'
                ? { ...base, date, max_intentions: max }
                : {
                    ...base,
                    weekday: jourSemaineApi(date),
                    max_intentions: max,
                  },
              { onSuccess: () => setOuvert(false) },
            );
          }}
        >
          <fieldset className="flex flex-wrap gap-3 text-13">
            <legend className="sr-only">Portée</legend>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name={`${id}-portee`}
                checked={portee === 'jour'}
                onChange={() => setPortee('jour')}
              />
              Ce jour seulement
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name={`${id}-portee`}
                checked={portee === 'semaine'}
                onChange={() => setPortee('semaine')}
              />
              Chaque semaine à cette heure
            </label>
          </fieldset>
          <label className="flex items-center gap-2 text-13">
            <input
              type="checkbox"
              checked={sansPlafond}
              onChange={(e) => setSansPlafond(e.target.checked)}
            />
            Sans plafond
          </label>
          {!sansPlafond && (
            <div className="space-y-1">
              <label htmlFor={`${id}-max`} className="text-13 font-medium">
                Intentions pour cette messe
              </label>
              <input
                id={`${id}-max`}
                type="number"
                min={PLAFOND_MIN}
                max={PLAFOND_MAX}
                step={1}
                required
                className={champ}
                value={valeur}
                onChange={(e) => setValeur(e.target.value)}
              />
            </div>
          )}
          <Button
            type="submit"
            size="sm"
            variant="outline"
            loading={fixer.isPending}
          >
            Enregistrer ce plafond
          </Button>
        </form>
      )}
      {retirer.isSuccess && (
        <p role="status" className="text-13 text-ink-3">
          {`Plafond retiré. S’applique maintenant : ${LIBELLES_SOURCE_PLAFOND[m.cap_source].toLowerCase()}${m.max_intentions === null ? ' (sans plafond)' : ` (${m.max_intentions})`}.`}
        </p>
      )}
      {erreur && (
        <p role="alert" className="text-14 text-err">
          {messageErreur(erreur)}
        </p>
      )}
    </li>
  );
}

/** Réglage du nombre d'intentions par messe (1 à 50, ou sans plafond). */
function Reglages({ noeud }: { noeud: NoeudStaff }) {
  const id = useId();
  const { data } = useReglagesIntentions(noeud.id);
  const modifier = useModifierReglages();
  const [valeur, setValeur] = useState<string | null>(null);
  const [sans, setSans] = useState<boolean | null>(null);
  const sansPlafond = sans ?? (data ? data.max_per_mass === null : false);
  const affichee =
    valeur ?? (data?.max_per_mass != null ? String(data.max_per_mass) : '');

  return (
    <form
      aria-label="Réglages des intentions"
      className="space-y-2 rounded-xl border border-line bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault();
        let n: number | null = null;
        if (!sansPlafond) {
          n = Number(affichee);
          if (!Number.isInteger(n) || n < PLAFOND_MIN || n > PLAFOND_MAX)
            return;
        }
        modifier.mutate(
          { node: noeud.id, max_per_mass: n },
          {
            onSuccess: () => {
              setValeur(null);
              setSans(null);
            },
          },
        );
      }}
    >
      <label htmlFor={`${id}-plafond`} className="text-14 font-semibold">
        Intentions par messe
      </label>
      <div className="flex gap-2">
        <input
          id={`${id}-plafond`}
          type="number"
          min={PLAFOND_MIN}
          max={PLAFOND_MAX}
          step={1}
          required={!sansPlafond}
          disabled={sansPlafond}
          className={champ}
          value={sansPlafond ? '' : affichee}
          onChange={(e) => setValeur(e.target.value)}
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          loading={modifier.isPending}
          disabled={!data}
        >
          Enregistrer
        </Button>
      </div>
      <label className="flex items-center gap-2 text-13">
        <input
          type="checkbox"
          checked={sansPlafond}
          onChange={(e) => setSans(e.target.checked)}
        />
        Sans plafond
      </label>
      <p className="text-13 text-ink-3">
        De {PLAFOND_MIN} à {PLAFOND_MAX}, ou sans plafond. Chaque messe peut
        aussi avoir son propre plafond. Une messe complète n’accepte plus
        d’intention à son heure.
      </p>
      {modifier.isSuccess && valeur === null && sans === null && (
        <p role="status" className="text-13 text-ink-3">
          Réglage enregistré.
        </p>
      )}
      {modifier.error && (
        <p role="alert" className="text-14 text-err">
          {messageErreur(modifier.error)}
        </p>
      )}
    </form>
  );
}

/** File des intentions de la paroisse (WEB-PAR-Intentions), `intentions.gerer`. */
export function IntentionsParoisse({ nodeId }: { nodeId: string }) {
  const { contexts, isPending } = useContexts();
  if (isPending) return <LoadingBlock />;
  const noeud: NoeudStaff = {
    id: nodeId,
    name: contexts.find((c) => c.nodeId === nodeId)?.name ?? 'la paroisse',
  };
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <MessesDuJour key={`m-${noeud.id}`} noeud={noeud} />
        <Reglages key={`r-${noeud.id}`} noeud={noeud} />
      </div>
      <Liste key={noeud.id} noeud={noeud} />
    </div>
  );
}
