'use client';

import { LiturgicalDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/skeleton';
import { useLiturgyToday } from '@/hooks/use-liturgy-today';
import { displayName, useMe } from '@/hooks/use-me';
import { useOfficeLabel } from '@/hooks/use-office-types';
import { useCan } from '@/lib/can';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { plural } from '@/utils/plural';

import { useConfessionGlance } from '../api/get-next-confessions';
import { useNodeDashboard } from '../api/get-node-dashboard';
import { useOverdueRequests } from '../api/get-overdue-requests';
import { useSundaySheetGlance } from '../api/get-sunday-sheet';

import { confessionDayLine, ConfessionsGlance, nextConfessionDay } from './confessions-glance';
import { OverdueRequestsCard } from './overdue-requests-card';
import { ParishTodo } from './parish-todo';
import { SundaySheetCard } from './sunday-sheet-card';
import { WeekActivity } from './week-activity';

/** Tableau de bord sur la semaine écoulée (« Activité de la semaine »). */
const PERIOD_DAYS = 7;

/** Le titre réel de la nomination (« curé », « administrateur paroissial »), à défaut le libellé du catalogue. */
const OfficeLine = ({ office, title }: { office: string; title?: string }) => {
  const catalogueLabel = useOfficeLabel(office);
  const label = title || catalogueLabel;
  return label ? <>{label.toLowerCase()}</> : null;
};

/** « Samedi 26 septembre, samedi de la 25e semaine du temps ordinaire » (liturgie du jour). */
const TodayLine = () => {
  const liturgy = useLiturgyToday();
  const date = dayjs().format('dddd D MMMM');
  const celebration = liturgy.data?.celebration;
  return (
    <p className="m-0 mt-1 flex items-center gap-2 text-16 text-ink-2">
      {liturgy.data && <LiturgicalDot color={liturgy.data.color} size={8} />}
      <span>
        {date.charAt(0).toUpperCase()}
        {date.slice(1)}
        {celebration ? `, ${celebration.charAt(0).toLowerCase()}${celebration.slice(1)}` : ''}
      </span>
    </p>
  );
};

type ParishDashboardProps = { nodeId: string; offices: string[]; officeLabels?: Record<string, string> };

/** Tableau de bord d'une paroisse (PAR-Tableau-de-bord, « Aujourd'hui »). */
export const ParishDashboard = ({ nodeId, offices, officeLabels }: ParishDashboardProps) => {
  const dashboard = useNodeDashboard(nodeId, PERIOD_DAYS);
  const canActes = useCan('actes.traiter', nodeId);
  const canConfessions = useCan('confessions.gerer', nodeId);
  const canPlanning = useCan('confessions.voir_planning', nodeId);
  const canAnnonces = useCan('annonces.publier', nodeId);
  const overdue = useOverdueRequests(nodeId, canActes);
  const confessions = useConfessionGlance(nodeId, canConfessions || canPlanning);
  const sheet = useSundaySheetGlance(nodeId, canAnnonces);
  const { data: me } = useMe();

  if (dashboard.isPending) return <LoadingBlock label="Chargement du tableau de bord…" lines={6} />;
  if (dashboard.isError) {
    return (
      <EmptyState
        tone="err"
        icon="alerte"
        title="Le tableau de bord n’a pas pu être chargé"
        action={
          <Button variant="secondary" onClick={() => dashboard.refetch()}>
            Réessayer
          </Button>
        }
      >
        {dashboard.error.message}
      </EmptyState>
    );
  }
  const data = dashboard.data;
  const actingOffices = offices.filter((o) => o !== 'plateforme');
  const first = displayName(me).first;
  const nextDay = confessions.data ? nextConfessionDay(confessions.data) : null;
  const overdueRows = overdue.data?.results ?? [];
  const hasSide = canConfessions || canPlanning || canAnnonces;
  const sundayDetail = sheet.data
    ? `${sheet.data.items.length ? plural(sheet.data.items.length, 'annonce', 'annonces') : 'Aucune annonce'} pour ${dayjs(sheet.data.sunday).format('dddd D MMMM')}`
    : undefined;

  return (
    <div>
      <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div className="min-w-0">
          <h1 className="m-0 text-32 font-semibold text-ink">Aujourd’hui</h1>
          <TodayLine />
        </div>
        <p className="m-0 text-14 text-ink-3">
          {first ? `Bonjour ${first}. ` : ''}
          {actingOffices.length > 0 && (
            <span>
              Vous agissez comme{' '}
              {actingOffices.map((o, i) => (
                <span key={o}>
                  {i > 0 && ' et '}
                  <OfficeLine office={o} title={officeLabels?.[o]} />
                </span>
              ))}
            </span>
          )}
        </p>
      </header>

      <div className={cn('mt-8 grid grid-cols-1 items-start gap-6', hasSide && 'lg:grid-cols-[minmax(0,1fr)_360px]')}>
        <div className="flex min-w-0 flex-col gap-6">
          <ParishTodo
            data={data}
            nodeId={nodeId}
            overdue={overdueRows}
            confessionsDetail={nextDay ? `${confessionDayLine(nextDay)} · ${plural(nextDay.booked, 'rendez-vous pris', 'rendez-vous pris')}` : undefined}
            sundayDetail={sundayDetail}
          />
          {canActes && overdueRows.length > 0 && <OverdueRequestsCard nodeId={nodeId} total={overdue.data?.count ?? overdueRows.length} rows={overdueRows} />}
          <WeekActivity data={data} />
        </div>
        {hasSide && (
          <div className="flex min-w-0 flex-col gap-6">
            {(canConfessions || canPlanning) && !confessions.isPending && <ConfessionsGlance nodeId={nodeId} day={nextDay} />}
            {canAnnonces && sheet.data && <SundaySheetCard nodeId={nodeId} sheet={sheet.data} />}
          </div>
        )}
      </div>
    </div>
  );
};
