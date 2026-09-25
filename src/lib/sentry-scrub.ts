import type { Breadcrumb, ErrorEvent, Event } from '@sentry/nextjs';

type TransactionEvent = Event & { type: 'transaction' };

/**
 * Filtre Sentry (spec §5, loi 2008-12) : aucune donnée religieuse ni personnelle ne sort.
 * - pas de corps de requête, de cookies, d'en-têtes, d'utilisateur ;
 * - URL sans paramètres et identifiants masqués (une URL /app/demandes/412 révèle une démarche) ;
 * - e-mails et numéros de téléphone masqués dans les messages ;
 * - aucun fil d'Ariane console (il peut contenir un message ou un nom).
 */
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE = /(?:\+?221[\s.-]?)?(?:\d[\s.-]?){8,}\d/g;

export const scrubUrl = (url: string | undefined): string | undefined => {
  if (!url) return url;
  const [base] = url.split(/[?#]/);
  return base.replace(UUID, ':id').replace(/\/\d+(?=\/|$)/g, '/:id');
};

export const scrubText = (text: string | undefined): string | undefined =>
  text?.replace(EMAIL, '[e-mail]').replace(PHONE, '[téléphone]');

export const scrubBreadcrumb = (crumb: Breadcrumb): Breadcrumb | null => {
  if (crumb.category === 'console') return null;
  const data = crumb.data ? { ...crumb.data } : undefined;
  if (data) {
    if (typeof data.url === 'string') data.url = scrubUrl(data.url);
    if (typeof data.from === 'string') data.from = scrubUrl(data.from);
    if (typeof data.to === 'string') data.to = scrubUrl(data.to);
    delete data.body;
    delete data.request_body;
    delete data.response_body;
  }
  return { ...crumb, message: scrubText(crumb.message), data };
};

export const scrubEvent = <T extends Event>(event: T): T => {
  const request = event.request ? { method: event.request.method, url: scrubUrl(event.request.url) } : undefined;
  return {
    ...event,
    user: undefined,
    request,
    transaction: scrubUrl(event.transaction),
    message: scrubText(event.message),
    breadcrumbs: event.breadcrumbs?.map(scrubBreadcrumb).filter((c: Breadcrumb | null): c is Breadcrumb => c !== null),
    exception: event.exception && {
      ...event.exception,
      values: event.exception.values?.map((v: { value?: string }) => ({ ...v, value: scrubText(v.value) })),
    },
  };
};

/** Options communes aux trois runtimes (client, serveur, edge). */
export const sentryPrivacyOptions = {
  sendDefaultPii: false,
  beforeSend: (event: ErrorEvent) => scrubEvent(event),
  beforeSendTransaction: (event: TransactionEvent) => scrubEvent(event),
  beforeBreadcrumb: (crumb: Breadcrumb) => scrubBreadcrumb(crumb),
};
