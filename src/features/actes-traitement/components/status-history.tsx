import { REQUEST_STATUS, type RequestStatus } from '@/components/signature/status-dot';
import { dayjs, hour } from '@/utils/dates';

import type { StatusLog } from '../types/processing';

import { SectionTitle } from './section-title';

const label = (status: string) => (status in REQUEST_STATUS ? REQUEST_STATUS[status as RequestStatus].label : status);

/** Journal immuable des statuts, du plus récent au plus ancien. */
export const StatusHistory = ({ history }: { history: StatusLog[] }) => (
  <section aria-labelledby="d-histo">
    <SectionTitle id="d-histo" n="04" title="Historique des statuts" aside="Journal immuable" />
    <ol className="m-0 flex list-none flex-col p-0">
      {[...history].reverse().map((entry, index) => (
        <li key={`${entry.created_at}-${index}`} className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 border-b border-line py-2.5">
          <span className="tnum text-meta text-ink-3">
            {dayjs(entry.created_at).format('DD.MM')} {hour(entry.created_at)}
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink">Statut : {label(entry.to_status)}</span>
            {entry.comment && <span className="block text-sm text-ink-2">{entry.comment}</span>}
          </span>
        </li>
      ))}
    </ol>
    <p className="m-0 mt-3 text-meta text-ink-3">Horodatage serveur · aucune entrée ne peut être modifiée ni supprimée</p>
  </section>
);
