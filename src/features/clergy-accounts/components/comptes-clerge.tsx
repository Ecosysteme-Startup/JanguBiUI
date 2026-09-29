'use client';

import { Copy, Inbox, Mail, UserPlus } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { StatusBadge, type StatusConfig } from '@/components/ui/status-badge';
import { useNoeuds } from '@/features/structure/api/hierarchie';
import { ApiError } from '@/lib/api-client';
import { useUser } from '@/lib/auth';
import { noeudsPour } from '@/lib/staff/capacites';

import {
  type CompteClerge,
  type Invitation,
  libelleRole,
  useActionCompte,
  useComptesEnAttente,
  useInvitations,
  useInviter,
  useRevoquerInvitation,
} from '../api/clergy-accounts';

const champ =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

const messageErreur = (e: unknown) =>
  e instanceof ApiError ? e.message : 'L’opération n’a pas abouti.';

const dateCourte = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      })
    : '—';

const initiales = (nom: string) =>
  nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase())
    .join('');

export const STATUT_INVITATION: Record<string, StatusConfig> = {
  en_attente: { label: 'Envoyée', tone: 'warning' },
  acceptee: { label: 'Acceptée', tone: 'success' },
  revoquee: { label: 'Révoquée', tone: 'danger' },
  expiree: { label: 'Expirée', tone: 'neutral' },
};

const MOTIFS_REFUS = [
  'Pièce ne correspondant pas à l’affectation',
  'Identité non confirmée par la chancellerie',
  'Affectation inconnue du diocèse',
];

// --- Invitation ---------------------------------------------------------------------

const DEGRES = [
  { value: 'pretre', label: 'Prêtre' },
  { value: 'diacre_permanent', label: 'Diacre permanent' },
  { value: 'diacre_transitoire', label: 'Diacre (transitoire)' },
  { value: 'eveque', label: 'Évêque' },
  { value: 'consacre', label: 'Religieux ou religieuse (consacré)' },
];

function DialogueInvitation({ onClose }: { onClose: () => void }) {
  const id = useId();
  const { data: user } = useUser();
  const racines = noeudsPour(user, 'comptes.valider');
  const [recherche, setRecherche] = useState('');
  const { data: trouves } = useNoeuds(
    { q: recherche, within: racines[0]?.id },
    recherche.trim().length >= 2,
  );
  const options = [
    ...racines.map((n) => ({ id: n.id, name: n.name })),
    ...(trouves?.results ?? [])
      .filter((n) => !racines.some((r) => r.id === n.id))
      .map((n) => ({ id: n.id, name: `${n.name} (${n.type.label})` })),
  ];
  const [noeud, setNoeud] = useState('');
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [degre, setDegre] = useState('pretre');
  const [jours, setJours] = useState(14);
  const inviter = useInviter();
  const noeudId = noeud || options[0]?.id || '';
  const [copie, setCopie] = useState(false);

  if (inviter.data) {
    const lien = inviter.data.accept_url ?? '';
    return (
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Invitation envoyée</DialogTitle>
            <DialogDescription>
              Un e-mail a été envoyé à {inviter.data.email}. Le lien ci-dessous
              n’est montré qu’une fois.
            </DialogDescription>
          </DialogHeader>
          {lien && (
            <div className="flex items-center gap-2">
              <input
                readOnly
                aria-label="Lien d’acceptation"
                className={champ}
                value={lien}
              />
              <Button
                size="sm"
                variant="outline"
                aria-label="Copier le lien"
                onClick={() => {
                  void navigator.clipboard?.writeText(lien);
                  setCopie(true);
                }}
              >
                <Copy className="size-4" aria-hidden="true" />
              </Button>
            </div>
          )}
          {copie && <p className="text-xs text-success">Lien copié.</p>}
          <DialogFooter>
            <Button onClick={onClose}>Terminer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Inviter un membre du clergé</DialogTitle>
          <DialogDescription>
            La personne crée son compte avec cette adresse, accepte
            l’invitation, puis son compte est validé ici.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!noeudId) return;
            const consacre = degre === 'consacre';
            inviter.mutate({
              node: noeudId,
              email: email.trim(),
              first_name: prenom.trim(),
              last_name: nom.trim(),
              etat_de_vie: consacre ? 'consacre' : 'clerc',
              degre_ordre: consacre ? 'aucun' : degre,
              ttl_days: jours,
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor={`${id}-prenom`} className="text-sm font-medium">
                Prénom
              </label>
              <input
                id={`${id}-prenom`}
                className={champ}
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor={`${id}-nom`} className="text-sm font-medium">
                Nom
              </label>
              <input
                id={`${id}-nom`}
                className={champ}
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor={`${id}-email`} className="text-sm font-medium">
              Adresse e-mail
            </label>
            <input
              id={`${id}-email`}
              type="email"
              required
              className={champ}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={`${id}-degre`} className="text-sm font-medium">
              État
            </label>
            <select
              id={`${id}-degre`}
              className={champ}
              value={degre}
              onChange={(e) => setDegre(e.target.value)}
            >
              {DEGRES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor={`${id}-recherche`} className="text-sm font-medium">
              Chercher une paroisse ou un nœud
            </label>
            <input
              id={`${id}-recherche`}
              className={champ}
              placeholder="Saint-Dominique"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
            <label htmlFor={`${id}-noeud`} className="sr-only">
              Affectation
            </label>
            <select
              id={`${id}-noeud`}
              className={champ}
              value={noeudId}
              onChange={(e) => setNoeud(e.target.value)}
              disabled={options.length === 0}
            >
              {options.length === 0 && (
                <option value="">Cherchez une paroisse</option>
              )}
              {options.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor={`${id}-jours`} className="text-sm font-medium">
              Validité du lien (jours)
            </label>
            <input
              id={`${id}-jours`}
              type="number"
              min={1}
              max={30}
              className={champ}
              value={jours}
              onChange={(e) => setJours(Number(e.target.value))}
            />
          </div>
          {inviter.isError && (
            <p role="alert" className="text-sm text-destructive">
              {messageErreur(inviter.error)}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              isLoading={inviter.isPending}
              disabled={!noeudId}
            >
              <Mail className="size-4" aria-hidden="true" />
              Envoyer l’invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Comptes en attente -------------------------------------------------------------

function PanneauCompte({
  compte,
  onFermer,
}: {
  compte: CompteClerge;
  onFermer: () => void;
}) {
  const id = useId();
  const action = useActionCompte();
  const [motif, setMotif] = useState(MOTIFS_REFUS[0]);
  const [message, setMessage] = useState('');
  const [refus, setRefus] = useState(false);
  const resultat = action.data;

  if (resultat && resultat.statut_verification === 'verifie') {
    return (
      <aside
        aria-label="Compte validé"
        className="space-y-3 rounded-xl border border-border bg-card p-4"
      >
        <p className="text-sm font-medium">
          {resultat.full_name || resultat.email} est validé.
        </p>
        {!resultat.is_active ? (
          <Button
            size="sm"
            isLoading={action.isPending}
            onClick={() => action.mutate({ id: compte.id, action: 'activate' })}
          >
            Activer le compte
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">Le compte est actif.</p>
        )}
        <Button size="sm" variant="ghost" onClick={onFermer}>
          Fermer
        </Button>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Compte sélectionné"
      className="space-y-4 rounded-xl border border-border bg-card p-4"
    >
      <div className="space-y-1">
        <p className="font-semibold">{compte.full_name || 'Sans nom'}</p>
        <p className="text-xs text-muted-foreground">{compte.email}</p>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-muted-foreground">Rôle demandé</dt>
        <dd>{libelleRole(compte.etat_de_vie, compte.degre_ordre)}</dd>
        <dt className="text-muted-foreground">Affectation</dt>
        <dd>{compte.node?.name ?? '—'}</dd>
        <dt className="text-muted-foreground">Inscrit le</dt>
        <dd>{dateCourte(compte.declared_at)}</dd>
      </dl>
      <p className="text-xs text-muted-foreground">
        À valider par la chancellerie : l’affectation doit correspondre à la
        nomination. Le compte n’a accès à aucun espace avant validation.
      </p>
      {!refus ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setRefus(true)}>
            Refuser
          </Button>
          <Button
            size="sm"
            isLoading={action.isPending}
            onClick={() => action.mutate({ id: compte.id, action: 'validate' })}
          >
            Valider le compte
          </Button>
        </div>
      ) : (
        <form
          className="space-y-2"
          aria-label="Refuser le compte"
          onSubmit={(e) => {
            e.preventDefault();
            const reason = [motif, message.trim()].filter(Boolean).join('. ');
            action.mutate(
              { id: compte.id, action: 'refuse', reason },
              { onSuccess: onFermer },
            );
          }}
        >
          <label htmlFor={`${id}-motif`} className="text-sm font-medium">
            Motif du refus
          </label>
          <select
            id={`${id}-motif`}
            className={champ}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
          >
            {MOTIFS_REFUS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <label htmlFor={`${id}-message`} className="sr-only">
            Précision
          </label>
          <textarea
            id={`${id}-message`}
            rows={3}
            maxLength={150}
            className={champ}
            placeholder="Précision pour la personne (facultatif)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Le motif est communiqué à la personne. L’action est inscrite au
            journal d’audit.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setRefus(false)}
            >
              Retour
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="destructive"
              isLoading={action.isPending}
            >
              Refuser le compte
            </Button>
          </div>
        </form>
      )}
      {action.isError && (
        <p role="alert" className="text-sm text-destructive">
          {messageErreur(action.error)}
        </p>
      )}
    </aside>
  );
}

function EnAttente() {
  const { data, isLoading, isError, refetch } = useComptesEnAttente();
  const [choisi, setChoisi] = useState<CompteClerge | null>(null);
  const colonnes: DataTableColumn<CompteClerge>[] = [
    {
      header: 'Compte',
      cell: (c) => (
        <span className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
          >
            {initiales(c.full_name || c.email)}
          </span>
          <span>
            <span className="block font-medium">
              {c.full_name || 'Sans nom'}
            </span>
            <span className="text-xs text-muted-foreground">
              {libelleRole(c.etat_de_vie, c.degre_ordre)}
            </span>
          </span>
        </span>
      ),
    },
    { header: 'Affectation déclarée', cell: (c) => c.node?.name ?? '—' },
    {
      header: 'Inscrit',
      cell: (c) => dateCourte(c.declared_at),
      hideOnMobile: true,
    },
    {
      header: 'Actions',
      isAction: true,
      cell: (c) => (
        <Button size="sm" variant="outline" onClick={() => setChoisi(c)}>
          Examiner
        </Button>
      ),
    },
  ];
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <DataTable
        data={data?.results}
        columns={colonnes}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        caption="Comptes du clergé en attente de validation"
        emptyState={
          <EmptyState
            icon={<Inbox />}
            title="Aucun compte en attente"
            description="Tout est à jour."
          />
        }
      />
      {choisi && (
        <PanneauCompte
          key={choisi.id}
          compte={choisi}
          onFermer={() => setChoisi(null)}
        />
      )}
    </div>
  );
}

function Invitations() {
  const [statut, setStatut] = useState('en_attente');
  const { data, isLoading, isError, refetch } = useInvitations({
    status: statut,
  });
  const revoquer = useRevoquerInvitation();
  const colonnes: DataTableColumn<Invitation>[] = [
    {
      header: 'Adresse invitée',
      cell: (i) => <span className="font-medium">{i.email}</span>,
    },
    {
      header: 'Rôle proposé',
      cell: (i) =>
        `${libelleRole(i.etat_de_vie, i.degre_ordre)} · ${i.node.name}`,
    },
    {
      header: 'État',
      cell: (i) => (
        <div className="space-y-1">
          <StatusBadge
            {...(STATUT_INVITATION[i.status] ?? {
              label: i.status,
              tone: 'neutral',
            })}
          />
          <span className="block text-xs text-muted-foreground">
            Envoyée le {dateCourte(i.created_at)} · expire le{' '}
            {dateCourte(i.expires_at)}
          </span>
        </div>
      ),
    },
    {
      header: 'Actions',
      isAction: true,
      cell: (i) =>
        i.status === 'en_attente' ? (
          <Button
            size="sm"
            variant="outline"
            isLoading={revoquer.isPending && revoquer.variables === i.id}
            onClick={() => revoquer.mutate(i.id)}
          >
            Révoquer
          </Button>
        ) : null,
    },
  ];
  return (
    <div className="space-y-3">
      <FilterPills
        options={[
          { value: 'en_attente', label: 'Envoyées' },
          { value: 'acceptee', label: 'Acceptées' },
          { value: 'expiree', label: 'Expirées' },
          { value: 'revoquee', label: 'Révoquées' },
        ]}
        value={statut}
        onChange={setStatut}
        ariaLabel="Filtrer les invitations"
      />
      {revoquer.isError && (
        <p role="alert" className="text-sm text-destructive">
          {messageErreur(revoquer.error)}
        </p>
      )}
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          data={data?.results}
          columns={colonnes}
          rowKey={(i) => i.id}
          isLoading={isLoading}
          caption="Invitations envoyées"
          emptyState={
            <EmptyState
              icon={<Mail />}
              title="Aucune invitation"
              description="Rien pour ce filtre."
            />
          }
        />
      )}
    </div>
  );
}

/** Validation du clergé (WEB-PLA-Clerge-Validation), capacité `comptes.valider`. */
export function ComptesClerge() {
  const [onglet, setOnglet] = useState('attente');
  const [inviter, setInviter] = useState(false);
  const { data: attente } = useComptesEnAttente();
  const { data: envoyees } = useInvitations({ status: 'en_attente' });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterPills
          options={[
            { value: 'attente', label: 'En attente', count: attente?.count },
            {
              value: 'invitations',
              label: 'Invitations',
              count: envoyees?.count,
            },
          ]}
          value={onglet}
          onChange={setOnglet}
          ariaLabel="Vue"
        />
        <Button size="sm" onClick={() => setInviter(true)}>
          <UserPlus className="size-4" aria-hidden="true" />
          Inviter un membre du clergé
        </Button>
      </div>
      {onglet === 'attente' ? <EnAttente /> : <Invitations />}
      {inviter && <DialogueInvitation onClose={() => setInviter(false)} />}
      <p className="text-xs text-muted-foreground">
        Chaque décision est inscrite au journal d’audit.
      </p>
    </div>
  );
}
