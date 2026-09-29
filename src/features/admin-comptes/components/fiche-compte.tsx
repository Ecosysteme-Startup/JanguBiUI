'use client';

import { AlertTriangle, Info } from 'lucide-react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/hooks/use-me';

import {
  type ActionCompte,
  type CompteDetail,
  LIBELLES_ACTIONS_REQUISES,
  LIBELLES_ETAT_DE_VIE,
  LIBELLES_ROLE,
  type ModificationCompte,
  useActionCompte,
  useAjouterOffice,
  useAuditComptes,
  useCompte,
  useFermerSession,
  useFinOffice,
  useModifierCompte,
  usePerimetre,
  useSupprimerCompte,
} from '../api/admin-comptes';
import { useTypesOffice } from '../api/types-office';
import { libelleAction, motifAudit } from '../utils/audit';

import { useCheminsComptes } from './chemins';
import {
  Avatar,
  BadgeStatut,
  BadgeSync,
  champ,
  date,
  dateHeure,
  DialogueConfirmation,
  MessageErreur,
} from './commun';

type Dialogue =
  | { type: 'action'; action: ActionCompte; grant?: boolean }
  | { type: 'supprimer' }
  | { type: 'profil' }
  | { type: 'actions-email' }
  | { type: 'office' }
  | null;

const LIBELLE_CLIENT: Record<string, string> = {
  'jangubi-mobile': 'Application mobile',
  'jangubi-web': 'Navigateur web',
};

/** Fiche d'un compte : état Keycloak en direct, fonctions, sessions,
 *  historique et actions (dans la portée de l'administrateur). */
export function FicheCompte({ id }: { id: string }) {
  const chemins = useCheminsComptes();
  const router = useRouter();
  const { data: moi } = useMe();
  const { data: perimetre } = usePerimetre();
  const { data: c, isLoading, isError, error, refetch } = useCompte(id);
  const action = useActionCompte(id);
  const supprimer = useSupprimerCompte(id);
  const fermer = useFermerSession(id);
  const finOffice = useFinOffice(id);
  const { data: historique } = useAuditComptes({ account: id, limit: 8 });
  const [dialogue, setDialogue] = useState<Dialogue>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (isError || !c)
    return (
      <ErrorState
        title="Compte indisponible"
        description={
          (error as { status?: number } | null)?.status === 404
            ? 'Ce compte n’existe pas ou n’est pas dans votre périmètre.'
            : 'La fiche n’a pas pu être chargée.'
        }
        onRetry={() => refetch()}
      />
    );

  const plateforme = !!perimetre?.is_platform_admin;
  const soi = !!moi && (moi.id === c.id || moi.email === c.email);
  const gerable = c.can_manage && !soi;
  const kc = c.keycloak;
  const kcDispo = !!kc?.available;
  const sessions = kc?.sessions ?? [];
  const verrouille = !!kc?.locked_by_brute_force;
  const offices = c.offices.filter((o) => !o.end_date);

  const lancer = (
    a: ActionCompte,
    body?: Record<string, unknown>,
    succes?: string,
  ) =>
    action.mutate(
      { action: a, body },
      {
        onSuccess: () => {
          setDialogue(null);
          setInfo(succes ?? null);
        },
      },
    );

  const dActions = dialogue?.type === 'action' ? dialogue : null;

  const actionsSecurite: {
    a: ActionCompte;
    titre: string;
    detail: string;
    visible: boolean;
    direct?: string;
  }[] = [
    {
      a: 'brute-force-unlock',
      titre: 'Déverrouiller le compte',
      detail: 'Autorise de nouveau les connexions',
      visible: verrouille,
      direct: 'Le compte est déverrouillé.',
    },
    {
      a: 'password-reset',
      titre: 'Réinitialiser le mot de passe',
      detail: 'Un lien est envoyé par e-mail',
      visible: true,
      direct: 'Le lien de nouveau mot de passe a été envoyé.',
    },
    {
      a: 'actions-email',
      titre: 'Envoyer un e-mail d’actions',
      detail: 'Mettre à jour le mot de passe, vérifier l’e-mail…',
      visible: true,
    },
    {
      a: 'verify-email',
      titre: 'Renvoyer la vérification de l’e-mail',
      detail: 'Un lien de vérification est envoyé',
      visible: !c.email_verified,
      direct: 'Le lien de vérification a été envoyé.',
    },
    {
      a: 'mark-email-verified',
      titre: 'Marquer l’e-mail comme vérifié',
      detail: 'Réservé à la plateforme · motif obligatoire',
      visible: plateforme && !c.email_verified,
    },
    {
      a: 'otp-reset',
      titre: 'Réinitialiser la double authentification',
      detail: 'À configurer de nouveau à la prochaine connexion',
      visible: !soi && (!kc || kc.otp !== false || kc.webauthn === true),
    },
    {
      a: 'logout',
      titre: 'Forcer la déconnexion',
      detail: `Ferme ${sessions.length} session(s) ouverte(s)`,
      visible: !soi,
      direct: 'Toutes les sessions ont été fermées.',
    },
    {
      a: 'resync',
      titre: 'Resynchroniser avec Keycloak',
      detail: 'Relit ou pousse le compte',
      visible: true,
      direct: 'Le compte a été resynchronisé.',
    },
  ];

  const TITRES_MOTIF: Partial<Record<ActionCompte, [string, string, string]>> =
    {
      disable: [
        `Désactiver le compte de ${c.full_name || c.email} ?`,
        'Ses sessions seront fermées et la personne ne pourra plus se connecter. Vous pourrez le réactiver à tout moment.',
        'Désactiver',
      ],
      'mark-email-verified': [
        'Marquer l’e-mail comme vérifié ?',
        `L’adresse ${c.email} sera considérée comme vérifiée sans lien envoyé.`,
        'Marquer vérifié',
      ],
      'otp-reset': [
        'Réinitialiser la double authentification ?',
        'Le second facteur est retiré ; il faudra le configurer à la prochaine connexion.',
        'Réinitialiser',
      ],
      'platform-admin': [
        dActions?.grant
          ? 'Donner le rôle d’administrateur plateforme ?'
          : 'Retirer le rôle d’administrateur plateforme ?',
        dActions?.grant
          ? 'Ce rôle donne accès à tous les comptes de la plateforme.'
          : 'La personne perd l’accès à l’administration de la plateforme.',
        dActions?.grant ? 'Donner le rôle' : 'Retirer le rôle',
      ],
    };

  return (
    <div className="space-y-6">
      <NextLink
        href={chemins.liste.getHref()}
        className="text-14 text-ink-3 hover:text-ink"
      >
        ← Tous les comptes
      </NextLink>

      <header className="flex flex-col gap-4 rounded-xl border bg-surface p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar nom={c.full_name || c.email} />
          <div>
            <h2 className="text-24 font-semibold">{c.full_name || c.email}</h2>
            <p className="text-14 text-ink-3">
              {c.email}
              {c.phone_number ? ` · ${c.phone_number}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <BadgeStatut status={c.status} />
              {verrouille && <Badge tone="err">Verrouillé</Badge>}
              <Badge tone={c.email_verified ? 'ok' : 'warn'}>
                {c.email_verified ? 'E-mail vérifié' : 'E-mail non vérifié'}
              </Badge>
              <BadgeSync sync={c.sync} />
            </div>
            <p className="mt-2 text-13 text-ink-3">
              {LIBELLES_ROLE[c.role]} · {LIBELLES_ETAT_DE_VIE[c.etat_de_vie]}
              {c.admin_node ? ` · ${c.admin_node.name}` : ''} · créé le{' '}
              {date(c.created_at)}
            </p>
          </div>
        </div>
        {gerable && (
          <Button
            variant="outline"
            onClick={() => setDialogue({ type: 'profil' })}
          >
            Modifier le profil
          </Button>
        )}
      </header>

      {info && (
        <p
          role="status"
          className="rounded-md border border-ok bg-ok-bg px-3 py-2 text-14 text-ok"
        >
          {info}
        </p>
      )}
      {!dialogue && (
        <MessageErreur
          error={action.error ?? fermer.error ?? finOffice.error}
        />
      )}

      {soi && (
        <p className="flex items-center gap-2 rounded-md border bg-surface-2 px-3 py-2 text-14">
          <Info className="size-4 shrink-0" aria-hidden="true" />
          C’est votre propre compte : les actions destructives ne sont pas
          proposées.
        </p>
      )}
      {!c.can_manage && !soi && (
        <p className="flex items-center gap-2 rounded-md border bg-surface-2 px-3 py-2 text-14">
          <Info className="size-4 shrink-0" aria-hidden="true" />
          Ce compte relève d’un niveau supérieur au vôtre : consultation
          seulement.
        </p>
      )}
      {kc && !kc.available && (
        <p className="flex items-center gap-2 rounded-md border border-warn-dot bg-warn-bg px-3 py-2 text-14">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          Keycloak est injoignable : l’état de connexion (sessions,
          verrouillage, double authentification) n’est pas connu pour le moment.
        </p>
      )}
      {c.sync_error && (
        <p className="rounded-md border border-warn-dot bg-warn-bg px-3 py-2 text-14">
          Dernière erreur de synchronisation : {c.sync_error}
        </p>
      )}
      {verrouille && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-err-line bg-err-bg p-4 text-14 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            Compte verrouillé après {kc?.failed_logins ?? 'plusieurs'}{' '}
            tentatives de connexion échouées.
          </span>
          {gerable && (
            <Button
              size="sm"
              loading={action.isPending}
              onClick={() =>
                lancer(
                  'brute-force-unlock',
                  undefined,
                  'Le compte est déverrouillé.',
                )
              }
            >
              Déverrouiller maintenant
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section
            aria-labelledby="f-fonctions"
            className="rounded-xl border bg-surface p-5"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 id="f-fonctions" className="text-18 font-semibold">
                Rôles et fonctions
              </h3>
              {gerable && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDialogue({ type: 'office' })}
                >
                  Ajouter une fonction
                </Button>
              )}
            </div>
            <ul className="divide-y text-14">
              {offices.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div>
                    <p className="font-medium">{o.office_label}</p>
                    <p className="text-13 text-ink-3">
                      {o.node.name} · depuis le {date(o.start_date)}
                    </p>
                  </div>
                  {gerable && (
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={
                        finOffice.isPending && finOffice.variables === o.id
                      }
                      onClick={() => finOffice.mutate(o.id)}
                    >
                      Mettre fin
                    </Button>
                  )}
                </li>
              ))}
              <li className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{LIBELLES_ROLE[c.role]}</p>
                  <p className="text-13 text-ink-3">
                    Rôle de connexion
                    {c.role === 'staff' ? ' · suit les fonctions en cours' : ''}
                  </p>
                </div>
                {plateforme && gerable && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setDialogue({
                        type: 'action',
                        action: 'platform-admin',
                        grant: c.role !== 'platform_admin',
                      })
                    }
                  >
                    {c.role === 'platform_admin'
                      ? 'Retirer le rôle plateforme'
                      : 'Donner le rôle plateforme'}
                  </Button>
                )}
              </li>
            </ul>
          </section>

          <section
            aria-labelledby="f-sessions"
            className="rounded-xl border bg-surface p-5"
          >
            <h3 id="f-sessions" className="mb-3 text-18 font-semibold">
              Sessions actives · {kcDispo ? sessions.length : '—'}
            </h3>
            {kcDispo && sessions.length === 0 && (
              <p className="text-14 text-ink-3">Aucune session ouverte.</p>
            )}
            <ul className="divide-y text-14">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div>
                    <p className="font-medium">
                      {s.clients
                        .map((x) => LIBELLE_CLIENT[x] ?? x)
                        .join(', ') || 'Session'}
                    </p>
                    <p className="text-13 text-ink-3">
                      {s.ip ?? 'Adresse inconnue'} · dernière activité{' '}
                      {dateHeure(s.last_access ?? s.started_at)}
                    </p>
                  </div>
                  {gerable && (
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={fermer.isPending && fermer.variables === s.id}
                      onClick={() => fermer.mutate(s.id)}
                    >
                      Fermer
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="f-historique"
            className="rounded-xl border bg-surface p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 id="f-historique" className="text-18 font-semibold">
                Historique du compte
              </h3>
              <NextLink
                href={`${chemins.journal.getHref()}?account=${c.id}`}
                className="text-14 text-primary hover:underline"
              >
                Voir dans le journal
              </NextLink>
            </div>
            {historique && historique.results.length === 0 && (
              <p className="text-14 text-ink-3">Aucune action enregistrée.</p>
            )}
            <ol className="space-y-2 text-14">
              {historique?.results.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="w-28 shrink-0 text-ink-3">
                    {dateHeure(e.at)}
                  </span>
                  <span>
                    {libelleAction(e.action)}
                    {e.actor_email ? ` par ${e.actor_email}` : ''}
                    {motifAudit(e.metadata)
                      ? ` · motif : ${motifAudit(e.metadata)}`
                      : ''}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {gerable && (
          <aside className="space-y-6">
            <section
              aria-labelledby="f-securite"
              className="rounded-xl border bg-surface p-5"
            >
              <h3 id="f-securite" className="mb-3 text-18 font-semibold">
                Sécurité
              </h3>
              <ul className="space-y-1">
                {actionsSecurite
                  .filter((x) => x.visible)
                  .map((x) => (
                    <li key={x.a}>
                      <button
                        type="button"
                        disabled={action.isPending}
                        onClick={() => {
                          setInfo(null);
                          if (x.a === 'actions-email')
                            setDialogue({ type: 'actions-email' });
                          else if (x.direct) lancer(x.a, undefined, x.direct);
                          else setDialogue({ type: 'action', action: x.a });
                        }}
                        className="w-full rounded-md p-2 text-left hover:bg-surface-2 disabled:opacity-50"
                      >
                        <span className="block text-14 font-medium">
                          {x.titre}
                        </span>
                        <span className="block text-13 text-ink-3">
                          {x.detail}
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </section>

            <section
              aria-labelledby="f-sensible"
              className="rounded-xl border border-err-line bg-surface p-5"
            >
              <h3
                id="f-sensible"
                className="mb-3 text-18 font-semibold text-err"
              >
                Zone sensible
              </h3>
              <div className="space-y-3">
                {c.status === 'desactive' ? (
                  <Button
                    variant="outline"
                    block
                    loading={action.isPending}
                    onClick={() =>
                      lancer(
                        'enable',
                        { reason: '' },
                        'Le compte est réactivé.',
                      )
                    }
                  >
                    Réactiver le compte
                  </Button>
                ) : (
                  <div>
                    <Button
                      variant="outline"
                      block
                      onClick={() =>
                        setDialogue({ type: 'action', action: 'disable' })
                      }
                    >
                      Désactiver le compte
                    </Button>
                    <p className="mt-1 text-13 text-ink-3">
                      Réversible · plus aucune connexion possible
                    </p>
                  </div>
                )}
                <div>
                  <Button
                    variant="danger"
                    block
                    onClick={() => setDialogue({ type: 'supprimer' })}
                  >
                    Supprimer le compte
                  </Button>
                  <p className="mt-1 text-13 text-ink-3">
                    Définitif · l’historique d’audit est conservé
                  </p>
                </div>
              </div>
            </section>
          </aside>
        )}
      </div>

      {dActions && TITRES_MOTIF[dActions.action] && (
        <DialogueConfirmation
          open
          onClose={() => {
            action.reset();
            setDialogue(null);
          }}
          titre={TITRES_MOTIF[dActions.action]![0]}
          description={TITRES_MOTIF[dActions.action]![1]}
          libelle={TITRES_MOTIF[dActions.action]![2]}
          destructif={dActions.action !== 'mark-email-verified'}
          motif
          isPending={action.isPending}
          error={action.error}
          onConfirm={(reason) =>
            lancer(
              dActions.action,
              dActions.action === 'platform-admin'
                ? { reason, grant: !!dActions.grant }
                : { reason },
              'L’action a été enregistrée.',
            )
          }
        />
      )}

      {dialogue?.type === 'supprimer' && (
        <DialogueConfirmation
          open
          onClose={() => {
            supprimer.reset();
            setDialogue(null);
          }}
          titre={`Supprimer le compte de ${c.full_name || c.email} ?`}
          description="Les données personnelles sont effacées dans Jàngu Bi et le compte est supprimé de Keycloak. L’historique d’audit est conservé. Cette action est définitive."
          libelle="Supprimer définitivement"
          destructif
          motif
          recopie={c.email}
          isPending={supprimer.isPending}
          error={supprimer.error}
          onConfirm={(reason) =>
            supprimer.mutate(
              { confirm_email: c.email, reason },
              {
                onSuccess: () => router.push(chemins.liste.getHref()),
              },
            )
          }
        />
      )}

      {dialogue?.type === 'actions-email' && (
        <DialogueActionsEmail
          actions={perimetre?.required_actions ?? []}
          isPending={action.isPending}
          error={action.error}
          onClose={() => {
            action.reset();
            setDialogue(null);
          }}
          onConfirm={(actions) =>
            lancer(
              'actions-email',
              { actions },
              'L’e-mail d’actions a été envoyé.',
            )
          }
        />
      )}

      {dialogue?.type === 'profil' && (
        <DialogueProfil compte={c} onClose={() => setDialogue(null)} />
      )}

      {dialogue?.type === 'office' && (
        <DialogueOffice compte={c} onClose={() => setDialogue(null)} />
      )}
    </div>
  );
}

function DialogueActionsEmail({
  actions,
  isPending,
  error,
  onClose,
  onConfirm,
}: {
  actions: string[];
  isPending: boolean;
  error: unknown;
  onClose: () => void;
  onConfirm: (a: string[]) => void;
}) {
  const liste = actions.length
    ? actions
    : Object.keys(LIBELLES_ACTIONS_REQUISES);
  const [choix, setChoix] = useState<string[]>([]);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Envoyer un e-mail d’actions</DialogTitle>
        </DialogHeader>
        <fieldset className="space-y-2 text-14">
          <legend className="mb-2 text-ink-3">
            Keycloak envoie un lien valable 72 heures pour :
          </legend>
          {liste.map((a) => (
            <label key={a} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={choix.includes(a)}
                onChange={(e) =>
                  setChoix((p) =>
                    e.target.checked ? [...p, a] : p.filter((x) => x !== a),
                  )
                }
              />
              {LIBELLES_ACTIONS_REQUISES[a] ?? a}
            </label>
          ))}
        </fieldset>
        <MessageErreur error={error} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            disabled={choix.length === 0}
            loading={isPending}
            onClick={() => onConfirm(choix)}
          >
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogueProfil({
  compte,
  onClose,
}: {
  compte: CompteDetail;
  onClose: () => void;
}) {
  const id = useId();
  const { data: perimetre } = usePerimetre();
  const modifier = useModifierCompte(compte.id);
  const [v, setV] = useState({
    first_name: compte.first_name,
    last_name: compte.last_name,
    email: compte.email,
    phone_number: compte.phone_number ?? '',
    admin_node_id: compte.admin_node?.id ?? '',
  });
  const noeuds = perimetre?.nodes ?? [];
  const soumettre = (e: React.FormEvent) => {
    e.preventDefault();
    const patch: ModificationCompte = {};
    if (v.first_name !== compte.first_name) patch.first_name = v.first_name;
    if (v.last_name !== compte.last_name) patch.last_name = v.last_name;
    if (v.email.trim() !== compte.email) patch.email = v.email.trim();
    if (v.phone_number !== (compte.phone_number ?? ''))
      patch.phone_number = v.phone_number.trim() || null;
    if (v.admin_node_id !== (compte.admin_node?.id ?? ''))
      patch.admin_node_id = v.admin_node_id || null;
    if (Object.keys(patch).length === 0) return onClose();
    modifier.mutate(patch, { onSuccess: onClose });
  };
  const ligne = (k: keyof typeof v, label: string, type = 'text') => (
    <div>
      <label htmlFor={`${id}-${k}`} className="text-14 font-medium">
        {label}
      </label>
      <input
        id={`${id}-${k}`}
        type={type}
        value={v[k]}
        onChange={(e) => setV((a) => ({ ...a, [k]: e.target.value }))}
        className={champ}
      />
    </div>
  );
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Modifier le profil</DialogTitle>
        </DialogHeader>
        <form onSubmit={soumettre} className="space-y-3">
          {ligne('first_name', 'Prénom')}
          {ligne('last_name', 'Nom')}
          {ligne('email', 'Adresse e-mail', 'email')}
          {ligne('phone_number', 'Téléphone', 'tel')}
          {noeuds.length > 0 && (
            <div>
              <label htmlFor={`${id}-node`} className="text-14 font-medium">
                Rattachement
              </label>
              <select
                id={`${id}-node`}
                value={v.admin_node_id}
                onChange={(e) =>
                  setV((a) => ({ ...a, admin_node_id: e.target.value }))
                }
                className={champ}
              >
                {!v.admin_node_id && <option value="">Aucun</option>}
                {compte.admin_node &&
                  !noeuds.some((n) => n.id === compte.admin_node?.id) && (
                    <option value={compte.admin_node.id}>
                      {compte.admin_node.name}
                    </option>
                  )}
                {noeuds.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <p className="text-13 text-ink-3">
            Les changements sont aussi appliqués dans Keycloak.
          </p>
          <MessageErreur error={modifier.error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" loading={modifier.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DialogueOffice({
  compte,
  onClose,
}: {
  compte: CompteDetail;
  onClose: () => void;
}) {
  const id = useId();
  const { data: perimetre } = usePerimetre();
  const { data: types = [] } = useTypesOffice();
  const ajouter = useAjouterOffice(compte.id);
  const noeuds = perimetre?.nodes ?? [];
  // Fonctions proposées limitées au périmètre : hors plateforme, pas
  // d'office nommé uniquement par la plateforme.
  const possibles = types.filter(
    (t) =>
      perimetre?.is_platform_admin ||
      !(t.appointed_by_platform && t.appointed_by.length === 0),
  );
  const [office, setOffice] = useState('');
  const [node, setNode] = useState('');
  const officeChoisi = office || possibles[0]?.code || '';
  const nodeChoisi = node || compte.admin_node?.id || noeuds[0]?.id || '';
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Ajouter une fonction</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!officeChoisi || !nodeChoisi) return;
            ajouter.mutate(
              { office_type: officeChoisi, node_id: nodeChoisi },
              { onSuccess: onClose },
            );
          }}
        >
          <div>
            <label htmlFor={`${id}-o`} className="text-14 font-medium">
              Fonction
            </label>
            <select
              id={`${id}-o`}
              value={officeChoisi}
              onChange={(e) => setOffice(e.target.value)}
              className={champ}
            >
              {possibles.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${id}-n`} className="text-14 font-medium">
              Rattachement
            </label>
            <select
              id={`${id}-n`}
              value={nodeChoisi}
              onChange={(e) => setNode(e.target.value)}
              className={champ}
            >
              {compte.admin_node &&
                !noeuds.some((n) => n.id === compte.admin_node?.id) && (
                  <option value={compte.admin_node.id}>
                    {compte.admin_node.name}
                  </option>
                )}
              {noeuds.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-13 text-ink-3">
            Seules les fonctions auxquelles vous pouvez nommer seront acceptées.
          </p>
          <MessageErreur error={ajouter.error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!officeChoisi || !nodeChoisi}
              loading={ajouter.isPending}
            >
              Ajouter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
