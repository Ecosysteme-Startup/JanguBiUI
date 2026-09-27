'use client';

import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingBlock } from '@/components/ui/skeleton';
import { dayjs, longDate } from '@/utils/dates';

import { useCashCollections } from '../../api/cash-collections';
import { useStaffFunds } from '../../api/staff-funds';
import { fcfa } from '../../utils/format';

import { CashCollectionForm, lastSunday } from './cash-collection-form';
import { CashCollectionsHistory } from './cash-collections-history';
import { DonsTopbar } from './dons-topbar';
import { panelClasses, QueryFailure } from './parts';

const CASH_KINDS = ['quete_dominicale', 'quete_imperee'];

/** Saisies validées du dernier week-end (samedi soir et dimanche), messe par messe. */
const WeekendCard = ({ nodeId }: { nodeId: string }) => {
  const sunday = lastSunday();
  const saturday = dayjs(sunday).subtract(1, 'day').format('YYYY-MM-DD');
  const validated = useCashCollections(nodeId, { status: 'validee' });
  const rows = (validated.data?.results ?? [])
    .filter((c) => c.mass_date === sunday || c.mass_date === saturday)
    .sort((a, b) => a.mass_date.localeCompare(b.mass_date) || (a.created_at ?? '').localeCompare(b.created_at ?? ''));
  const total = rows.reduce((sum, c) => sum + c.amount, 0);
  const title = longDate(sunday).replace(/ \d{4}$/, '');

  return (
    <section aria-labelledby="quete-t-we" className={`${panelClasses} px-6 pb-3 pt-5`}>
      <h2 id="quete-t-we" className="m-0 text-18 font-semibold text-ink">
        {title}
      </h2>
      <p className="m-0 mb-3 mt-0.5 text-14 text-ink-2">Saisies validées du week-end</p>
      {validated.isPending ? (
        <LoadingBlock label="Chargement des saisies validées…" lines={2} />
      ) : rows.length === 0 ? (
        <p className="m-0 border-t border-line py-3 text-14 text-ink-3">Aucune saisie validée pour ce week-end.</p>
      ) : (
        <dl className="m-0">
          {rows.map((c) => (
            <div key={c.id} className="flex justify-between gap-3 border-t border-line py-2.5 text-14">
              <dt className="text-ink-2">
                {c.mass_date === saturday ? 'Samedi, ' : ''}
                {c.mass_label}
              </dt>
              <dd className="tnum m-0 whitespace-nowrap font-semibold">{fcfa(c.amount)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 border-t border-line py-3 text-15 font-semibold">
            <dt>Total</dt>
            <dd className="tnum m-0 whitespace-nowrap">{fcfa(total)}</dd>
          </div>
        </dl>
      )}
    </section>
  );
};

const RULES = [
  'Comptez à deux, dans la sacristie, juste après la messe.',
  'Déposez les espèces au coffre avec le bordereau signé.',
  'Une saisie validée ne se modifie plus ; en cas d’erreur, elle est rejetée puis saisie à nouveau.',
];

/** WEB-PAR-Quete-Saisie : saisie d'une quête en espèces et validation par une autre personne. */
export const CashCollectionScreen = ({ nodeId }: { nodeId: string }) => {
  const funds = useStaffFunds(nodeId, { status: 'ouvert' });
  const cashFunds = (funds.data ?? []).filter((f) => CASH_KINDS.includes(f.kind));

  return (
    <div className="flex flex-col">
      <DonsTopbar nodeId={nodeId} current="Saisir une quête" />
      <PageHeader compact title="Saisir une quête" description="Les quêtes en espèces, messe par messe, comptées par deux personnes." />
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {funds.isPending ? (
          <div className={`${panelClasses} p-6`}>
            <LoadingBlock label="Chargement des fonds…" lines={6} />
          </div>
        ) : funds.isError ? (
          <div className={panelClasses}>
            <QueryFailure error={funds.error} nodeId={nodeId} what="Quêtes" />
          </div>
        ) : (
          <CashCollectionForm nodeId={nodeId} funds={cashFunds} />
        )}
        <aside aria-label="Week-end et rappel" className="flex flex-col gap-6">
          <WeekendCard nodeId={nodeId} />
          <section aria-labelledby="quete-t-rappel" className={`${panelClasses} p-6 pt-5`}>
            <h2 id="quete-t-rappel" className="m-0 text-18 font-semibold text-ink">
              Rappel
            </h2>
            <ul className="m-0 mt-3 flex list-none flex-col gap-2.5 p-0 text-14 text-ink-2">
              {RULES.map((rule) => (
                <li key={rule} className="flex gap-2.5">
                  <Icon name="check" size={18} className="mt-px shrink-0 text-ok" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
      <CashCollectionsHistory nodeId={nodeId} />
    </div>
  );
};
