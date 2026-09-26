import { REQUEST_STATUS, type RequestStatus } from '@/components/signature/status-dot';
import { paths } from '@/config/paths';
import { dayjs, hour } from '@/utils/dates';

import type { AppNotification } from '../api/get-notifications';

export type NotificationCategory = 'demandes' | 'annonces' | 'pretres' | 'confession' | 'autre';

export type NotificationView = { title: string; detail?: string; href?: string; category: NotificationCategory };

const str = (v: unknown) => (typeof v === 'string' ? v : '');

/**
 * Texte et lien d'une notification selon son `event_type` (backend : documents, news, agenda,
 * messaging, confessions). Aucun contenu de message n'est jamais transmis dans la notification.
 */
export const describeNotification = (n: AppNotification): NotificationView => {
  const p = n.payload;
  const type = n.event_type;
  if (type === 'documents.status') {
    const status = str(p.status);
    const label = status in REQUEST_STATUS ? REQUEST_STATUS[status as RequestStatus].label.toLowerCase() : 'mise à jour';
    return {
      title: `Votre demande ${str(p.reference)} : ${label}`,
      detail: status === 'ready_for_pickup' ? 'L’original est à retirer au secrétariat de la paroisse.' : undefined,
      href: p.request_id ? paths.app.demandes.detail.getHref(str(p.request_id)) : paths.app.demandes.list.getHref(),
      category: 'demandes',
    };
  }
  if (type.startsWith('documents.')) {
    return { title: `Demande ${str(p.reference)} mise à jour`, href: paths.app.demandes.list.getHref(), category: 'demandes' };
  }
  if (type === 'news.published') {
    return {
      title: `Nouvelle annonce${p.node_name ? ` de ${str(p.node_name)}` : ''}`,
      detail: str(p.title) || undefined,
      href: p.article_id ? paths.app.paroisse.annonce.getHref(str(p.article_id)) : paths.app.paroisse.root.getHref('annonces'),
      category: 'annonces',
    };
  }
  if (type === 'agenda.reminder') {
    return {
      title: `Rappel : ${str(p.title)}`,
      detail: p.start_at ? `${dayjs(str(p.start_at)).format('dddd D MMMM')}, ${hour(str(p.start_at))}.` : undefined,
      href: p.event_id !== undefined ? paths.app.paroisse.evenement.getHref(String(p.event_id)) : undefined,
      category: 'annonces',
    };
  }
  if (type === 'new_message') {
    return {
      title: `${str(p.sender_name) || 'Un prêtre'} vous a écrit`,
      detail: 'Le contenu du message s’affiche seulement dans la conversation.',
      href: p.conversation_id ? paths.app.pretres.conversation.getHref(str(p.conversation_id)) : paths.app.pretres.list.getHref(),
      category: 'pretres',
    };
  }
  if (type === 'conversation.purge_upcoming') {
    return {
      title: 'Une conversation va être effacée',
      detail: p.purge_date ? `Effacement prévu le ${dayjs(str(p.purge_date)).format('D MMMM')}.` : undefined,
      href: p.conversation_id ? paths.app.pretres.conversation.getHref(str(p.conversation_id)) : undefined,
      category: 'pretres',
    };
  }
  if (type.startsWith('confessions.')) {
    const when = p.starts_at ? `${dayjs(str(p.starts_at)).format('dddd D MMMM')}, ${hour(str(p.starts_at))}` : '';
    const where = str(p.place);
    const detail = [when, where].filter(Boolean).join(' · ') || undefined;
    const title =
      type === 'confessions.cancelled'
        ? 'Votre rendez-vous de confession est annulé'
        : type === 'confessions.reminder'
          ? 'Rappel : rendez-vous de confession'
          : 'Rendez-vous de confession';
    return { title, detail, href: paths.app.confession.getHref(), category: 'confession' };
  }
  if (type === 'personnes.complement') {
    return {
      title: 'Complément demandé pour votre déclaration',
      detail: 'La chancellerie attend un justificatif : le détail est dans votre profil.',
      href: paths.app.profil.getHref(),
      category: 'autre',
    };
  }
  return { title: 'Nouvelle notification', category: 'autre' };
};

/** Libellé du groupe de jour : « Aujourd'hui · jeudi 24 septembre », « Hier · … », « Plus tôt ». */
export const dayGroupOf = (createdAt: string, now: Date = new Date()) => {
  const diff = dayjs(now).startOf('day').diff(dayjs(createdAt).startOf('day'), 'day');
  if (diff <= 0) return `Aujourd’hui · ${dayjs(createdAt).format('dddd D MMMM')}`;
  if (diff === 1) return `Hier · ${dayjs(createdAt).format('dddd D MMMM')}`;
  if (diff < 7) return 'Plus tôt cette semaine';
  return 'Plus ancien';
};
