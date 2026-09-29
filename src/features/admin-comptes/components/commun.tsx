'use client';

import { usePathname } from 'next/navigation';
import { useId, useState } from 'react';

import { Badge } from '@/components/ui/badge/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Link } from '@/components/ui/link/link';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

import {
  type Compte,
  LIBELLES_STATUT,
  LIBELLES_SYNC,
  usePerimetre,
} from '../api/admin-comptes';
import { messageErreur } from '../utils/erreurs';

export const champ =
  'mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring';

const NBSP = ' ';

/** Nombre avec séparateur de milliers insécable (« 4 896 »). */
export const nombre = (n: number | null | undefined) =>
  n == null ? '—' : n.toLocaleString('fr-FR').replace(/\s/g, NBSP);

export const dateHeure = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export const date = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

export const initiales = (nom: string) =>
  nom
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase())
    .join('');

export function Avatar({ nom }: { nom: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
    >
      {initiales(nom) || '·'}
    </span>
  );
}

export function BadgeStatut({ status }: { status: Compte['status'] }) {
  const variant =
    status === 'actif'
      ? 'success'
      : status === 'desactive'
        ? 'secondary'
        : 'warning';
  return <Badge variant={variant}>{LIBELLES_STATUT[status]}</Badge>;
}

export function BadgeSync({ sync }: { sync: Compte['sync'] }) {
  const variant =
    sync === 'synchronise' ? 'info' : sync === 'ecart' ? 'warning' : 'outline';
  return <Badge variant={variant}>{LIBELLES_SYNC[sync]}</Badge>;
}

export function MessageErreur({ error }: { error: unknown }) {
  const m = messageErreur(error);
  if (!m) return null;
  return (
    <p
      role="alert"
      className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
    >
      {m}
    </p>
  );
}

/** Onglets de la section « Comptes » (le journal et la synchronisation
 *  n'apparaissent que si la personne y a accès). */
export function NavComptes() {
  const pathname = usePathname() ?? '';
  const { data: perimetre } = usePerimetre();
  const c = paths.app.admin.comptes;
  const onglets = [
    { href: c.tableau.getHref(), label: 'Tableau de bord', exact: true },
    { href: c.liste.getHref(), label: 'Comptes' },
    ...(perimetre?.is_platform_admin
      ? [{ href: c.synchronisation.getHref(), label: 'Synchronisation' }]
      : []),
    { href: c.journal.getHref(), label: 'Journal d’audit' },
  ];
  return (
    <nav aria-label="Administration des comptes" className="mb-6 border-b">
      <ul className="-mb-px flex gap-4 overflow-x-auto text-sm">
        {onglets.map((o) => {
          const actif = o.exact
            ? pathname === o.href
            : pathname.startsWith(o.href);
          return (
            <li key={o.href}>
              <Link
                href={o.href}
                aria-current={actif ? 'page' : undefined}
                className={cn(
                  'inline-block whitespace-nowrap border-b-2 px-1 pb-2',
                  actif
                    ? 'border-primary font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {o.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Confirmation d'une action sensible. `motif` : champ motif obligatoire
 * (journalisé). `recopie` : valeur à recopier à l'identique (e-mail du
 * compte avant suppression).
 */
export function DialogueConfirmation({
  open,
  onClose,
  titre,
  description,
  libelle,
  destructif,
  motif,
  recopie,
  isPending,
  error,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  titre: string;
  description?: React.ReactNode;
  libelle: string;
  destructif?: boolean;
  motif?: boolean;
  recopie?: string;
  isPending?: boolean;
  error?: unknown;
  onConfirm: (motif: string) => void;
}) {
  const id = useId();
  const [texte, setTexte] = useState('');
  const [copie, setCopie] = useState('');
  const motifOk = !motif || texte.trim().length > 0;
  const copieOk =
    recopie == null ||
    copie.trim().toLowerCase() === recopie.trim().toLowerCase();
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setTexte('');
          setCopie('');
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{titre}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (motifOk && copieOk) onConfirm(texte.trim());
          }}
        >
          {motif && (
            <div>
              <label htmlFor={`${id}-m`} className="text-sm font-medium">
                Motif (obligatoire, visible dans le journal)
              </label>
              <textarea
                id={`${id}-m`}
                value={texte}
                maxLength={255}
                required
                onChange={(e) => setTexte(e.target.value)}
                className={cn(champ, 'h-20 py-2')}
              />
            </div>
          )}
          {recopie != null && (
            <div>
              <label htmlFor={`${id}-c`} className="text-sm font-medium">
                Recopiez l’adresse e-mail du compte pour confirmer
              </label>
              <input
                id={`${id}-c`}
                type="email"
                autoComplete="off"
                value={copie}
                placeholder={recopie}
                onChange={(e) => setCopie(e.target.value)}
                className={champ}
              />
            </div>
          )}
          <MessageErreur error={error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant={destructif ? 'destructive' : 'default'}
              disabled={!motifOk || !copieOk}
              isLoading={isPending}
            >
              {libelle}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
