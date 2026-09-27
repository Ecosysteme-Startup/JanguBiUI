'use client';

import NextLink from 'next/link';
import type * as React from 'react';

import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { useCan } from '@/lib/can';
import { cn } from '@/utils/cn';
import { plural } from '@/utils/plural';

import type { NodeDashboard } from '../api/get-node-dashboard';
import type { OverdueRequest } from '../api/get-overdue-requests';

type Todo = { key: string; icon: IconName; title: React.ReactNode; detail: string; href?: string; action?: string; label?: string; urgent?: boolean };

/** « JB-1 et JB-2 », « JB-1, JB-2 et JB-3 » */
const refsList = (refs: string[]) => (refs.length < 2 ? (refs[0] ?? '') : `${refs.slice(0, -1).join(', ')} et ${refs[refs.length - 1]}`);

type ParishTodoProps = { data: NodeDashboard; nodeId: string; overdue: OverdueRequest[]; confessionsDetail?: string; sundayDetail?: string };

/** « Reste à faire aujourd'hui » (maquette PAR-Tableau-de-bord) : liens limités aux capacités. */
export const ParishTodo = ({ data, nodeId, overdue, confessionsDetail, sundayDetail }: ParishTodoProps) => {
  const canActes = useCan('actes.traiter', nodeId);
  const canMessages = useCan('messagerie.recevoir_fideles', nodeId);
  const canConfessions = useCan('confessions.gerer', nodeId);
  const canPlanning = useCan('confessions.voir_planning', nodeId);
  const canAnnonces = useCan('annonces.publier', nodeId);
  const c = data.actes.counts;
  const demandes = paths.espace.demandes.list.getHref(nodeId);
  const toProcess = (c.submitted ?? 0) + (c.under_verification ?? 0);
  const late = data.actes.overdue;
  const lateRefs = overdue.slice(0, 3).map((r) => r.reference);

  const todos = [
    toProcess > 0 && {
      key: 'actes',
      icon: 'document',
      title: (
        <>
          Traiter <strong className="font-semibold">{toProcess}</strong> {toProcess > 1 ? 'demandes d’actes' : 'demande d’acte'}
        </>
      ),
      detail: late > 0 ? `${late} en retard${lateRefs.length ? ` : ${refsList(lateRefs)}` : ''}` : 'Aucune en retard.',
      href: canActes ? demandes : undefined,
      action: 'Ouvrir la file',
      urgent: late > 0,
    },
    toProcess === 0 &&
      late > 0 && {
        key: 'retard',
        icon: 'alerte',
        title: `${plural(late, 'demande d’acte en retard', 'demandes d’actes en retard')}`,
        detail: 'Délai indicatif dépassé : à traiter en priorité.',
        href: canActes ? `${demandes}?retard=1` : undefined,
        action: 'Traiter',
        urgent: true,
      },
    data.messagerie.unanswered_48h > 0 && {
      key: 'messages',
      icon: 'message',
      title: `${plural(data.messagerie.unanswered_48h, 'conversation sans réponse', 'conversations sans réponse')} depuis 48 h`,
      detail: 'Messages chiffrés, aucun administrateur n’y a accès.',
      href: canMessages ? paths.espace.messagerie.getHref(nodeId) : undefined,
      action: 'Répondre',
      label: 'Répondre dans la messagerie',
    },
    data.confessions.upcoming_booked > 0 && {
      key: 'confessions',
      icon: 'confession',
      title: `${plural(data.confessions.upcoming_booked, 'rendez-vous de confession', 'rendez-vous de confession')} à venir`,
      detail: confessionsDetail ?? 'Le nom des pénitents n’est visible que du prêtre concerné.',
      href: canConfessions || canPlanning ? paths.espace.confessions.getHref(nodeId) : undefined,
      action: 'Voir le planning',
      label: 'Voir le planning des confessions',
    },
    (c.info_requested ?? 0) > 0 && {
      key: 'complement',
      icon: 'horloge',
      title: `${plural(c.info_requested ?? 0, 'complément attendu', 'compléments attendus')} des fidèles`,
      detail: 'La demande reprend dès que le fidèle a répondu.',
    },
    (c.ready_for_pickup ?? 0) > 0 && {
      key: 'retrait',
      icon: 'boite',
      title: `${plural(c.ready_for_pickup ?? 0, 'acte prêt à retirer', 'actes prêts à retirer')}`,
      detail: 'Originaux papier attendus au secrétariat.',
      href: canActes ? `${demandes}?statut=ready_for_pickup` : undefined,
      action: 'Voir',
      label: 'Voir les actes prêts à retirer',
    },
    canAnnonces && {
      key: 'annonce',
      icon: 'annonce',
      title: 'Préparer l’annonce du dimanche',
      detail: sundayDetail ?? 'Rédigez, relisez et programmez la feuille d’annonces.',
      href: paths.espace.annonces.nouvelle.getHref(nodeId),
      action: 'Préparer',
      label: 'Préparer l’annonce du dimanche',
    },
  ].filter(Boolean) as Todo[];

  return (
    <section aria-labelledby="tb-traiter" className="overflow-hidden rounded-16 border border-line bg-paper shadow-card">
      <div className="flex items-center justify-between gap-4 px-6 pb-4 pt-5">
        <h2 id="tb-traiter" className="m-0 text-20 font-semibold text-ink">
          Reste à faire aujourd’hui
        </h2>
        <span className="tnum text-13 text-ink-3">{plural(todos.length, 'point', 'points')}</span>
      </div>
      {todos.length === 0 ? (
        <p className="m-0 border-t border-line px-6 py-5 text-15 text-ink-2">Rien d’urgent : aucune demande en attente, aucune conversation sans réponse.</p>
      ) : (
        <ul className="m-0 list-none p-0">
          {todos.map((todo) => (
            <li key={todo.key} className="flex min-h-16 flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-6 py-2.5 hover:bg-surface">
              <span
                aria-hidden="true"
                className={cn(
                  'inline-flex size-[22px] shrink-0 items-center justify-center rounded-full',
                  todo.urgent ? 'bg-warn-bg text-warn' : 'bg-tint-50 text-primary',
                )}
              >
                <Icon name={todo.icon} size={13} strokeWidth={2} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-15 text-ink">{todo.title}</span>
                <span className={cn('tnum text-13', todo.urgent ? 'text-warn' : 'text-ink-3')}>{todo.detail}</span>
              </span>
              {todo.href && (
                <Button asChild variant="outline" size="sm" className="h-9 rounded-12 px-3.5">
                  <NextLink href={todo.href} aria-label={todo.label}>
                    {todo.action}
                  </NextLink>
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
