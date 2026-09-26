import NextLink from 'next/link';

import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { cn } from '@/utils/cn';
import { frenchTypo } from '@/utils/french-typo';

import type { AppNotification } from '../api/get-notifications';
import { describeNotification, type NotificationCategory, notificationTime } from '../utils/describe';

const CATEGORY_ICON: Record<NotificationCategory, IconName> = {
  demandes: 'document',
  annonces: 'paroisse',
  pretres: 'message',
  confession: 'calendrier-ok',
  autre: 'cloche',
};

/**
 * Rangée de notification (FID-Notifications) : point non lu 8, icône 20, titre 15 (600 non lue),
 * détail 14, heure 13 (primaire si non lue). « Marquer comme lu » au survol ou au focus.
 * Toute la rangée est cliquable (lien étiré) ; le bouton reste un vrai bouton à part.
 */
export const NotificationRow = ({ item, first, onRead }: { item: AppNotification; first: boolean; onRead: (id: string) => void }) => {
  const view = describeNotification(item);
  const unread = !item.is_read;
  const icon = item.event_type === 'agenda.reminder' ? 'calendrier' : CATEGORY_ICON[view.category];
  const text = (
    <>
      <span className={cn('text-15 text-ink', unread ? 'font-semibold' : 'font-medium')}>{frenchTypo(view.title)}</span>
      {view.detail && <span className="text-14 text-ink-2">{frenchTypo(view.detail)}</span>}
    </>
  );
  const stretch = 'flex min-w-0 flex-col text-ink after:absolute after:inset-0 hover:text-ink hover:no-underline';

  return (
    <li
      className={cn(
        'group relative grid grid-cols-[8px_20px_minmax(0,1fr)_auto] items-start gap-3 px-5 py-4 hover:bg-surface focus-within:bg-surface',
        !first && 'before:absolute before:left-[72px] before:right-0 before:top-0 before:h-px before:bg-line',
      )}
    >
      {unread ? <span role="img" aria-label="Non lue" className="mt-2 size-2 rounded-full bg-primary-fill" /> : <span />}
      <Icon name={icon} size={20} className="mt-px text-ink-2" />
      {view.href ? (
        <NextLink href={view.href} className={stretch} onClick={() => unread && onRead(item.id)}>
          {text}
        </NextLink>
      ) : (
        <button type="button" className={cn(stretch, 'text-left')} onClick={() => unread && onRead(item.id)}>
          {text}
        </button>
      )}
      <span className="flex items-center gap-3">
        {unread && (
          <Button
            variant="outline"
            size="sm"
            className="relative z-10 hidden text-13 group-focus-within:inline-flex group-hover:inline-flex"
            onClick={() => onRead(item.id)}
          >
            <Icon name="check" size={16} />
            Marquer comme lu
          </Button>
        )}
        <span className={cn('tnum whitespace-nowrap text-13 leading-[22px]', unread ? 'font-semibold text-primary' : 'text-ink-3')}>
          {notificationTime(item.created_at)}
        </span>
      </span>
    </li>
  );
};
