import type { Metadata } from 'next';

import { CapabilityPage } from '@/components/layouts/capability-page';
import type { AuditFilters } from '@/features/audit/api/get-audit-events';
import { AuditJournal } from '@/features/audit/components/audit-journal';

export const metadata: Metadata = { title: 'Journal d’audit' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const TEXT_KEYS = ['node', 'actor', 'action', 'date_from', 'date_to'] as const;

/** Journal d'audit (PLA-Audit) : filtres lus dans l'URL. */
const Page = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const filters: AuditFilters = {};
  TEXT_KEYS.forEach((key) => {
    const value = params[key];
    if (typeof value === 'string' && value) filters[key] = value;
  });
  const offset = Number(params.offset);
  if (Number.isInteger(offset) && offset > 0) filters.offset = offset;
  return (
    <CapabilityPage capacite={['plateforme.admin', 'audit.voir']}>
      <AuditJournal filters={filters} />
    </CapabilityPage>
  );
};

export default Page;
