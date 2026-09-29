import NextLink from 'next/link';

import { Avatar } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { availabilityStatus, isAbsent } from '@/utils/availability-label';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import type { ReachablePriest } from '../api/get-priests';

/** « 1er octobre », « 28 septembre ». */
const frenchDay = (iso: string) => {
  const d = dayjs(iso);
  return `${d.date() === 1 ? '1er' : d.date()} ${d.format('MMMM')}`;
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Ligne de disponibilité vue par le fidèle : point vert (joignable) ou ambre (absent, fermé). */
export const priestStatusLine = (priest: ReachablePriest) => {
  if (isAbsent(priest.availability)) {
    return { tone: 'warn' as const, text: `Absent jusqu’au ${frenchDay(priest.availability!.absent_until!)}` };
  }
  const status = availabilityStatus(priest.availability);
  if (priest.availability && !priest.availability.accepts_new_conversations) {
    return { tone: 'warn' as const, text: 'Ne prend pas de nouveaux échanges' };
  }
  return { tone: 'ok' as const, text: status.detail ? capitalize(status.detail) : 'Joignable' };
};

type PriestCardProps = {
  priest: ReachablePriest;
  /** Conversation déjà ouverte avec ce prêtre : « Reprendre la conversation ». */
  conversationHref?: string;
  onWrite: () => void;
  pending: boolean;
};

/** Carte d'un prêtre joignable (FID-Pretres) : identité, disponibilité, écrire, confession. */
export const PriestCard = ({ priest, conversationHref, onWrite, pending }: PriestCardProps) => {
  const absent = isAbsent(priest.availability);
  const line = priestStatusLine(priest);
  return (
    <li className="flex flex-col rounded-16 border border-line bg-paper p-6 shadow-card">
      <div className="flex items-center gap-4">
        <Avatar name={priest.full_name} size={56} className={cn('text-18', absent && 'bg-surface-2 text-ink-2')} />
        <span className="flex min-w-0 flex-col">
          <span className="text-17 font-semibold text-ink">{priest.full_name}</span>
          {priest.office && <span className="text-14 text-ink-2">{priest.office.label}</span>}
        </span>
      </div>
      <span className={cn('mt-4 inline-flex items-center gap-2 text-14', line.tone === 'ok' ? 'text-ok' : 'text-warn')}>
        <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', line.tone === 'ok' ? 'bg-ok-dot' : 'bg-warn-dot')} />
        {line.text}
      </span>
      <span aria-hidden="true" className="min-h-5 flex-1" />
      {conversationHref ? (
        <NextLink
          href={conversationHref}
          className={cn(buttonVariants({ variant: 'outline', block: true }), 'mt-6 min-h-11')}
          aria-label={`Reprendre la conversation avec ${priest.full_name}`}
        >
          <Icon name="message" size={18} />
          Reprendre la conversation
        </NextLink>
      ) : (
        <Button
          variant="outline"
          block
          className="mt-6 min-h-11"
          onClick={onWrite}
          disabled={pending}
          aria-label={`Écrire à ${priest.full_name}`}
        >
          <Icon name="message" size={18} />
          Écrire
        </Button>
      )}
      {absent ? (
        <p className="m-0 mt-2 flex min-h-10 items-center justify-center text-center text-14 text-ink-3">
          Pas de confession avec lui avant le {frenchDay(priest.availability!.absent_until!)}
        </p>
      ) : (
        <NextLink
          href={paths.app.confession.getHref()}
          aria-label={`Rendez-vous de confession avec ${priest.full_name}`}
          className={cn(buttonVariants({ variant: 'ghost', block: true }), 'mt-2')}
        >
          <Icon name="calendrier" size={18} />
          Rendez-vous de confession
        </NextLink>
      )}
    </li>
  );
};
