import NextLink from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ScrollRegion } from '@/components/ui/scroll-region';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import type { Health } from '../../types/schemas';

import { incidentText, WEBHOOK_STATUS } from './payment-labels';

const GRID = 'grid grid-cols-[120px_minmax(0,1fr)_minmax(0,380px)] gap-4 px-6';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « Aujourd'hui », « Hier » ou « Dim. 27 sept. » */
const dayLabel = (iso: string) => {
  const d = dayjs(iso);
  if (d.isSame(dayjs(), 'day')) return 'Aujourd’hui';
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Hier';
  return capitalize(d.format('ddd D MMM')).replace(/ /g, ' ');
};

/**
 * « Incidents des 7 derniers jours » (WEB-PLA-Paiements) : heure, type traduit, action
 * recommandée. Jamais de nom ni de montant de donateur.
 */
export const IncidentsCard = ({
  incidents,
}: {
  incidents: Health['incidents'];
}) => (
  <Card
    as="section"
    padding="none"
    aria-labelledby="pa-inc"
    className="mt-6 overflow-hidden"
  >
    <div className="flex items-baseline justify-between gap-4 px-6 pb-4 pt-5">
      <h2 id="pa-inc" className="m-0 text-20 font-semibold">
        Incidents des 7 derniers jours
      </h2>
      <NextLink
        href={paths.plateforme.audit.getHref()}
        className="whitespace-nowrap text-14 font-semibold"
      >
        Journal d’audit
      </NextLink>
    </div>
    {incidents.length === 0 ? (
      <EmptyState
        icon="succes"
        title="Aucun incident"
        className="border-t border-line"
      >
        Toutes les notifications des 7 derniers jours ont été traitées.
      </EmptyState>
    ) : (
      <ScrollRegion label="Incidents de paiement, défilement horizontal">
        <table
          aria-label="Incidents de paiement"
          className="block w-full min-w-[640px] border-collapse text-14 text-ink"
        >
          <thead className="block">
            <tr
              className={cn(
                GRID,
                'h-10 items-center border-t border-line bg-surface text-13 font-medium text-ink-3',
              )}
            >
              <th scope="col" className="text-left font-medium">
                Heure
              </th>
              <th scope="col" className="text-left font-medium">
                Incident
              </th>
              <th scope="col" className="text-left font-medium">
                Action recommandée
              </th>
            </tr>
          </thead>
          <tbody className="block">
            {incidents.map((incident) => {
              const text = incidentText(incident.error);
              const status = WEBHOOK_STATUS[incident.status];
              return (
                <tr
                  key={`${incident.at}-${incident.error}`}
                  className={cn(
                    GRID,
                    'items-start border-t border-line py-3 hover:bg-surface',
                  )}
                >
                  <td className="tnum flex flex-col">
                    <span className="font-semibold">
                      {dayjs(incident.at).format('HH:mm')}
                    </span>
                    <span className="text-13 text-ink-3">
                      {dayLabel(incident.at)}
                    </span>
                  </td>
                  <th
                    scope="row"
                    className="flex min-w-0 flex-col text-left font-normal"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{text.label}</span>
                      {status && (
                        <Badge
                          tone={status.tone}
                          dot={!status.icon}
                          icon={status.icon}
                          className="h-5.5 px-2"
                        >
                          {status.label}
                        </Badge>
                      )}
                    </span>
                    <span className="text-13 text-ink-2">{text.detail}</span>
                  </th>
                  <td className="text-ink-2">{text.action}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollRegion>
    )}
  </Card>
);
