'use client';

import { useId, useState } from 'react';

import { Badge, type BadgeTone } from '@/components/ui/badge';
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
import { Icon } from '@/components/ui/icon';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ApiError } from '@/lib/api-client';
import { useNodes } from '@/lib/can';

import {
  type CompteClerge,
  type FiltresComptes,
  type Invitation,
  type Justificatif,
  libelleRole,
  ROLES_FILTRE,
  STATUTS_FILTRE,
  useActionCompte,
  useComptesClerge,
  useComptesEnAttente,
  type VueComptes,
  useInvitations,
  useInviter,
  useRevoquerInvitation,
} from '../api/clergy-accounts';
import { useRechercheNoeuds } from '../api/noeuds';

const champ =
  'w-full rounded-md border border-line-field bg-paper px-3 py-2 text-14';

const messageErreur = (e: unknown) => {
  if (e instanceof ApiError && e.code?.startsWith('file_'))
    return 'La pièce justificative n’a pas pu être prise en compte. Déposez-la de nouveau.';
  return e instanceof ApiError ? e.message : 'L’opération n’a pas abouti.';
};

function LienJustificatif({ piece }: { piece?: Justificatif | null }) {
  if (!piece) return null;
  return piece.url ? (
    <a
      href={piece.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-14 text-primary underline-offset-2 hover:underline"
    >
      <Icon name="document" className="size-4" aria-hidden="true" />
      {piece.file_name}
    </a>
  ) : (
    <span className="inline-flex items-center gap-1 text-14">
      <Icon name="document" className="size-4" aria-hidden="true" />
      {piece.file_name}
    </span>
  );
}

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

export const STATUT_INVITATION: Record<
  string,
  { label: string; tone: BadgeTone }
> = {
  en_attente: { label: 'Envoyée', tone: 'warn' },
  acceptee: { label: 'Acceptée', tone: 'ok' },
  revoquee: { label: 'Révoquée', tone: 'err' },
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
  const racines = useNodes('comptes.valider')
    .filter((n) => n.nodeId)
    .map((n) => ({ id: n.nodeId as string, name: n.name }));
  const [recherche, setRecherche] = useState('');
  const { data: trouves } = useRechercheNoeuds(
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
  const [fichier, setFichier] = useState<File | null>(null);
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
                <Icon name="copier" className="size-4" aria-hidden="true" />
              </Button>
            </div>
          )}
          {copie && <p className="text-13 text-ok">Lien copié.</p>}
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
              fichier,
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor={`${id}-prenom`} className="text-14 font-medium">
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
              <label htmlFor={`${id}-nom`} className="text-14 font-medium">
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
            <label htmlFor={`${id}-email`} className="text-14 font-medium">
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
            <label htmlFor={`${id}-degre`} className="text-14 font-medium">
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
            <label htmlFor={`${id}-recherche`} className="text-14 font-medium">
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
            <label htmlFor={`${id}-jours`} className="text-14 font-medium">
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
          <div className="space-y-1">
            <label htmlFor={`${id}-piece`} className="text-14 font-medium">
              Pièce justificative (facultatif)
            </label>
            <input
              id={`${id}-piece`}
              type="file"
              accept="application/pdf,image/*"
              className="block w-full text-14"
              onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
            />
            <p className="text-13 text-ink-3">
              Lettre de nomination ou décret d’affectation, si vous l’avez.
            </p>
          </div>
          {inviter.isError && (
            <p role="alert" className="text-14 text-err">
              {messageErreur(inviter.error)}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              loading={inviter.isPending}
              disabled={!noeudId}
            >
              <Icon name="mail" className="size-4" aria-hidden="true" />
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
        className="space-y-3 rounded-xl border border-line bg-surface p-4"
      >
        <p className="text-14 font-medium">
          {resultat.full_name || resultat.email} est validé.
        </p>
        {!resultat.is_active ? (
          <Button
            size="sm"
            loading={action.isPending}
            onClick={() => action.mutate({ id: compte.id, action: 'activate' })}
          >
            Activer le compte
          </Button>
        ) : (
          <p className="text-13 text-ink-3">Le compte est actif.</p>
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
      className="space-y-4 rounded-xl border border-line bg-surface p-4"
    >
      <div className="space-y-1">
        <p className="font-semibold">{compte.full_name || 'Sans nom'}</p>
        <p className="text-13 text-ink-3">{compte.email}</p>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-14">
        <dt className="text-ink-3">Rôle demandé</dt>
        <dd>{libelleRole(compte.etat_de_vie, compte.degre_ordre)}</dd>
        <dt className="text-ink-3">Affectation</dt>
        <dd>{compte.node?.name ?? '—'}</dd>
        <dt className="text-ink-3">Inscrit le</dt>
        <dd>{dateCourte(compte.declared_at)}</dd>
        <dt className="text-ink-3">Pièce justificative</dt>
        <dd>
          {compte.justificatif ? (
            <LienJustificatif piece={compte.justificatif} />
          ) : (
            'Aucune'
          )}
        </dd>
      </dl>
      <p className="text-13 text-ink-3">
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
            loading={action.isPending}
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
          <label htmlFor={`${id}-motif`} className="text-14 font-medium">
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
          <p className="text-13 text-ink-3">
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
              variant="danger"
              loading={action.isPending}
            >
              Refuser le compte
            </Button>
          </div>
        </form>
      )}
      {action.isError && (
        <p role="alert" className="text-14 text-err">
          {messageErreur(action.error)}
        </p>
      )}
    </aside>
  );
}

function FiltresBarre({
  vue,
  filtres,
  onChange,
}: {
  vue: VueComptes;
  filtres: FiltresComptes;
  onChange: (f: FiltresComptes) => void;
}) {
  const id = useId();
  const perimetre = useNodes('comptes.valider')
    .filter((n) => n.nodeId)
    .map((n) => ({ id: n.nodeId as string, name: n.name }));
  const maj = (cle: keyof FiltresComptes) => (v: string) =>
    onChange({ ...filtres, [cle]: v });
  return (
    <div
      role="group"
      aria-label="Filtrer les comptes"
      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div>
        <label htmlFor={`${id}-q`} className="sr-only">
          Nom ou e-mail
        </label>
        <input
          id={`${id}-q`}
          type="search"
          placeholder="Nom ou e-mail"
          className={champ}
          value={filtres.q ?? ''}
          onChange={(e) => maj('q')(e.target.value)}
        />
      </div>
      {perimetre.length > 1 && (
        <div>
          <label htmlFor={`${id}-diocese`} className="sr-only">
            Diocèse
          </label>
          <select
            id={`${id}-diocese`}
            className={champ}
            value={filtres.diocese ?? ''}
            onChange={(e) => maj('diocese')(e.target.value)}
          >
            <option value="">Tous les diocèses</option>
            {perimetre.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label htmlFor={`${id}-role`} className="sr-only">
          Rôle
        </label>
        <select
          id={`${id}-role`}
          className={champ}
          value={filtres.role ?? ''}
          onChange={(e) => maj('role')(e.target.value)}
        >
          <option value="">Tous les rôles</option>
          {ROLES_FILTRE.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      {vue === 'all' && (
        <div>
          <label htmlFor={`${id}-statut`} className="sr-only">
            Statut
          </label>
          <select
            id={`${id}-statut`}
            className={champ}
            value={filtres.statut ?? ''}
            onChange={(e) => maj('statut')(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            {STATUTS_FILTRE.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

const TEXTES_VUE: Record<
  VueComptes,
  { caption: string; vide: string; description: string }
> = {
  pending: {
    caption: 'Comptes du clergé en attente de validation',
    vide: 'Aucun compte en attente',
    description: 'Tout est à jour.',
  },
  validated: {
    caption: 'Comptes du clergé validés',
    vide: 'Aucun compte validé',
    description: 'Rien pour ces filtres.',
  },
  all: {
    caption: 'Comptes du clergé',
    vide: 'Aucun compte',
    description: 'Rien pour ces filtres.',
  },
};

const LIBELLES_STATUT_COMPTE: Record<
  string,
  { label: string; tone: BadgeTone }
> = {
  declare: { label: 'Déclaré', tone: 'warn' },
  complement: { label: 'Complément demandé', tone: 'warn' },
  verifie: { label: 'Validé', tone: 'ok' },
  rejete: { label: 'Refusé', tone: 'err' },
};

function Comptes({ vue }: { vue: VueComptes }) {
  const [filtres, setFiltres] = useState<FiltresComptes>({});
  const { data, isLoading, isError, refetch } = useComptesClerge(vue, filtres);
  const textes = TEXTES_VUE[vue];
  const [choisi, setChoisi] = useState<CompteClerge | null>(null);
  const colonnes: DataTableColumn<CompteClerge>[] = [
    {
      header: 'Compte',
      cell: (c) => (
        <span className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tint-50 text-13 font-semibold text-primary"
          >
            {initiales(c.full_name || c.email)}
          </span>
          <span>
            <span className="block font-medium">
              {c.full_name || 'Sans nom'}
            </span>
            <span className="text-13 text-ink-3">
              {libelleRole(c.etat_de_vie, c.degre_ordre)}
            </span>
          </span>
        </span>
      ),
    },
    { header: 'Affectation déclarée', cell: (c) => c.node?.name ?? '—' },
    ...(vue === 'pending'
      ? []
      : [
          {
            header: 'Statut',
            cell: (c: CompteClerge) => (
              <Badge
                tone={
                  LIBELLES_STATUT_COMPTE[c.statut_verification]?.tone ??
                  'neutral'
                }
              >
                {LIBELLES_STATUT_COMPTE[c.statut_verification]?.label ??
                  c.statut_verification}
              </Badge>
            ),
          },
        ]),
    {
      header: 'Inscrit',
      cell: (c) => dateCourte(c.declared_at),
      hideOnMobile: true,
    },
    {
      header: 'Actions',
      isAction: true,
      cell: (c) =>
        c.statut_verification === 'declare' ||
        c.statut_verification === 'complement' ? (
          <Button size="sm" variant="outline" onClick={() => setChoisi(c)}>
            Examiner
          </Button>
        ) : (
          <LienJustificatif piece={c.justificatif} />
        ),
    },
  ];
  return (
    <div className="space-y-3">
      <FiltresBarre vue={vue} filtres={filtres} onChange={setFiltres} />
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <DataTable
            data={data?.results}
            columns={colonnes}
            rowKey={(c) => c.id}
            isLoading={isLoading}
            caption={textes.caption}
            emptyState={
              <EmptyState icon="boite" title={textes.vide}>
                {textes.description}
              </EmptyState>
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
          <Badge tone={STATUT_INVITATION[i.status]?.tone ?? 'neutral'}>
            {STATUT_INVITATION[i.status]?.label ?? i.status}
          </Badge>
          <span className="block text-13 text-ink-3">
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
            loading={revoquer.isPending && revoquer.variables === i.id}
            onClick={() => revoquer.mutate(i.id)}
          >
            Révoquer
          </Button>
        ) : null,
    },
  ];
  return (
    <div className="space-y-3">
      <SegmentedControl
        size="sm"
        label="Filtrer les invitations"
        options={[
          ['en_attente', 'Envoyées'],
          ['acceptee', 'Acceptées'],
          ['expiree', 'Expirées'],
          ['revoquee', 'Révoquées'],
        ]}
        value={statut}
        onChange={setStatut}
      />
      {revoquer.isError && (
        <p role="alert" className="text-14 text-err">
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
            <EmptyState icon="mail" title="Aucune invitation">
              Rien pour ce filtre.
            </EmptyState>
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
        <SegmentedControl
          label="Vue"
          options={[
            ['attente', 'En attente'],
            ['valides', 'Validés'],
            ['tous', 'Tous les comptes'],
            ['invitations', 'Invitations'],
          ]}
          counts={{ attente: attente?.count, invitations: envoyees?.count }}
          value={onglet}
          onChange={setOnglet}
        />
        <Button size="sm" onClick={() => setInviter(true)}>
          <Icon name="utilisateur-plus" className="size-4" aria-hidden="true" />
          Inviter un membre du clergé
        </Button>
      </div>
      {onglet === 'attente' && <Comptes key="p" vue="pending" />}
      {onglet === 'valides' && <Comptes key="v" vue="validated" />}
      {onglet === 'tous' && <Comptes key="a" vue="all" />}
      {onglet === 'invitations' && <Invitations />}
      {inviter && <DialogueInvitation onClose={() => setInviter(false)} />}
      <p className="text-13 text-ink-3">
        Chaque décision est inscrite au journal d’audit.
      </p>
    </div>
  );
}
