import NextLink from 'next/link';

import { StatusDot } from '@/components/signature/status-dot';
import { Icon, type IconName } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { type DocumentRequest, documentLabel, reasonLabel } from '../types/request';
import { progressOf } from '../utils/timeline';

type Footer = { icon: IconName; tone: 'ink' | 'warn' | 'ok'; text: string; action?: string };

/** Bandeau du bas de carte : ce que la paroisse a écrit en dernier, ou ce qu'on attend du fidèle. */
const footerOf = (r: DocumentRequest): Footer | null => {
  const last = [...r.history].reverse().find((h) => h.comment.trim() && h.to_status !== 'submitted');
  if (r.status === 'info_requested') {
    return { icon: 'alerte', tone: 'warn', text: last ? `Complément demandé : ${last.comment}` : 'La paroisse attend un complément de votre part.', action: 'Répondre' };
  }
  if (r.status === 'ready_for_pickup') {
    const where = r.pickup?.place_name ?? r.target_node?.name;
    return { icon: 'succes', tone: 'ok', text: `L’original est prêt : à retirer${where ? ` au secrétariat de ${where}` : ' au secrétariat'}.`, action: 'Voir le suivi' };
  }
  if (last && (r.status === 'under_verification' || r.status === 'submitted')) {
    return { icon: 'message', tone: 'ink', text: `Message du secrétariat, ${dayjs(last.created_at).format('ddd D MMM')} : ${last.comment}`, action: 'Voir le suivi' };
  }
  return null;
};

const FOOTER_TONE = { ink: 'text-ink-2', warn: 'text-warn', ok: 'text-ok' } as const;

/** Carte d'une demande (FID-Demandes) : référence, statut, acte, paroisse du sacrement, progression. */
export const RequestCard = ({ request: r }: { request: DocumentRequest }) => {
  const steps = progressOf(r);
  const footer = footerOf(r);
  const href = paths.app.demandes.detail.getHref(r.id);
  return (
    <li className="overflow-hidden rounded-16 border border-line bg-paper shadow-card">
      <NextLink href={href} className="block px-6 pb-5 pt-6 text-ink hover:bg-surface hover:text-ink hover:no-underline">
        <span className="flex items-center justify-between gap-4">
          <span className="tnum text-14 text-ink-3">
            {r.reference} · déposée le {dayjs(r.created_at).format('D MMM')}
          </span>
          <StatusDot status={r.status} />
        </span>
        <span className="mt-2 flex items-center justify-between gap-4">
          <span className="flex min-w-0 flex-col">
            <span className="text-18 font-semibold">{frenchTypo(documentLabel(r))}</span>
            <span className="text-15 text-ink-2">
              {[r.target_node?.name, `pour ${reasonLabel(r)}`].filter(Boolean).join(' · ')}
            </span>
          </span>
          <Icon name="chevron-droite" size={20} className="shrink-0 text-ink-3" />
        </span>
        {steps.length > 0 && (
          <span className="mt-5 grid grid-cols-4 gap-2" aria-hidden="true">
            {steps.map((s) => (
              <span key={s.key} className="min-w-0">
                <span className={cn('block h-1.5 rounded-3', s.state === 'upcoming' ? 'bg-surface-2' : 'bg-primary-fill')} />
                <span
                  className={cn(
                    'mt-2 block text-13',
                    s.state === 'current' ? 'font-semibold text-ink' : s.state === 'done' ? 'text-ink-2' : 'text-ink-3',
                  )}
                >
                  {s.label} {s.when && <span className="font-normal text-ink-3">{s.when}</span>}
                </span>
              </span>
            ))}
          </span>
        )}
      </NextLink>
      {footer && (
        <div className={cn('flex items-center gap-2.5 border-t border-line bg-surface px-6 py-3.5 text-14', FOOTER_TONE[footer.tone])}>
          <Icon name={footer.icon} size={18} className="shrink-0" />
          <span className="min-w-0 flex-1">{frenchTypo(footer.text)}</span>
          {footer.action && (
            <NextLink href={href} className="hit whitespace-nowrap text-14 font-semibold" aria-label={`${footer.action} : ${r.reference}`}>
              {footer.action}
            </NextLink>
          )}
        </div>
      )}
    </li>
  );
};
