'use client';

import { RefreshCw, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { Link } from '@/components/ui/link/link';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';

import {
  useAuditComptes,
  usePerimetre,
  useTableauBord,
} from '../api/admin-comptes';
import { libelleAction } from '../utils/audit';

import { dateHeure, nombre } from './commun';

function Tuile({
  label,
  valeur,
  detail,
  href,
}: {
  label: string;
  valeur: number;
  detail: string;
  href?: string;
}) {
  const corps = (
    <>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold">{nombre(valeur)}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </>
  );
  const cls = 'block rounded-xl border bg-card p-4';
  return href ? (
    <Link href={href} className={`${cls} hover:border-primary/40`}>
      {corps}
    </Link>
  ) : (
    <div className={cls}>{corps}</div>
  );
}

/** Tableau de bord de l'administration des comptes (compteurs du périmètre,
 *  synchronisation, dernières actions). */
export function TableauDeBordComptes() {
  const { data: perimetre } = usePerimetre();
  const { data, isLoading, isError, refetch } = useTableauBord();
  const { data: audit } = useAuditComptes({ limit: 5 });
  const c = paths.app.admin.comptes;
  const liste = (q: string) => `${c.liste.getHref()}?${q}`;

  if (isError)
    return (
      <ErrorState
        description="Le tableau de bord des comptes n’a pas pu être chargé."
        onRetry={() => refetch()}
      />
    );

  const portee = perimetre
    ? perimetre.is_platform_admin
      ? 'toute la plateforme'
      : perimetre.nodes.map((n) => n.name).join(', ') || 'aucun nœud'
    : '…';

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold">
            Administration des comptes
          </h2>
          <p className="text-sm text-muted-foreground">Portée : {portee}.</p>
        </div>
        <Button asChild icon={<UserPlus className="size-4" />}>
          <Link href={c.nouveau.getHref()}>Créer un compte</Link>
        </Button>
      </div>

      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <section
            aria-label="Comptes"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Tuile
              label="Comptes actifs"
              valeur={data.comptes.actifs}
              detail={`dont ${nombre(data.comptes.crees_30_jours)} créés en 30 jours`}
              href={liste('status=actif')}
            />
            <Tuile
              label="En attente"
              valeur={data.comptes.en_attente}
              detail="invitation non acceptée ou e-mail à vérifier"
              href={liste('status=en_attente')}
            />
            <Tuile
              label="Désactivés"
              valeur={data.comptes.desactives}
              detail="aucune connexion possible"
              href={liste('status=desactive')}
            />
            <Tuile
              label="Responsables"
              valeur={data.comptes.responsables}
              detail={`${nombre(data.comptes.administrateurs_plateforme)} administrateur(s) plateforme`}
              href={liste('role=staff')}
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section
              aria-labelledby="tdb-sync"
              className="rounded-xl border bg-card p-5"
            >
              <h3 id="tdb-sync" className="font-serif text-lg font-semibold">
                Synchronisation avec Keycloak
              </h3>
              <p className="mt-1 text-sm">
                {data.comptes.ecarts + data.comptes.non_lies === 0
                  ? 'Aucun écart à examiner.'
                  : `${nombre(data.comptes.ecarts)} écart(s) et ${nombre(data.comptes.non_lies)} compte(s) non relié(s) à examiner.`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Dernier passage :{' '}
                {data.synchronisation.derniere_reconciliation
                  ? `${dateHeure(data.synchronisation.derniere_reconciliation)}${
                      data.synchronisation.derniere_reconciliation_reussie ===
                      false
                        ? ' · échec'
                        : ''
                    }`
                  : 'aucun'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={liste('sync=ecart')}>Voir les écarts</Link>
                </Button>
                {perimetre?.is_platform_admin && (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    icon={<RefreshCw className="size-4" />}
                  >
                    <Link href={c.synchronisation.getHref()}>
                      Lancer une réconciliation
                    </Link>
                  </Button>
                )}
              </div>
            </section>

            <section
              aria-labelledby="tdb-traiter"
              className="rounded-xl border bg-card p-5"
            >
              <h3 id="tdb-traiter" className="font-serif text-lg font-semibold">
                À traiter
              </h3>
              <ul className="mt-3 divide-y text-sm">
                {[
                  {
                    l: 'Invitations en attente',
                    v: data.comptes.invitations_en_attente,
                    q: 'status=en_attente',
                  },
                  {
                    l: 'Comptes non reliés à Keycloak',
                    v: data.comptes.non_lies,
                    q: 'sync=non_lie',
                  },
                  {
                    l: 'Comptes en écart',
                    v: data.comptes.ecarts,
                    q: 'sync=ecart',
                  },
                ].map((r) => (
                  <li key={r.l}>
                    <Link
                      href={liste(r.q)}
                      className="flex items-center justify-between py-2 hover:text-primary"
                    >
                      <span>{r.l}</span>
                      <span className="font-semibold">{nombre(r.v)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}

      <section aria-labelledby="tdb-journal">
        <div className="mb-2 flex items-center justify-between">
          <h3 id="tdb-journal" className="font-serif text-lg font-semibold">
            Dernières actions
          </h3>
          <Link
            href={c.journal.getHref()}
            className="text-sm text-primary hover:underline"
          >
            Tout le journal
          </Link>
        </div>
        {audit && audit.results.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune action récente.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card text-sm">
            {audit?.results.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
              >
                <span className="w-32 shrink-0 text-muted-foreground">
                  {dateHeure(e.at)}
                </span>
                <span className="shrink-0">{e.actor_email ?? 'Système'}</span>
                <span className="min-w-0 flex-1">
                  {libelleAction(e.action)}
                  {e.target_email ? ` · ${e.target_email}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
