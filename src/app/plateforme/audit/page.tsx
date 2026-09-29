import type { Metadata } from 'next';

import { CapabilityPage } from '@/components/layouts/capability-page';
import { AuditJournal } from '@/features/audit/components/audit-journal';
import { auditFiltersFrom } from '@/features/audit/utils/filters';

export const metadata: Metadata = { title: 'Journal d’audit' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Journal d'audit (PLA-Audit) : filtres lus dans l'URL. */
const Page = async ({ searchParams }: Props) => (
  <CapabilityPage capacite={['plateforme.admin', 'audit.voir']}>
    <AuditJournal filters={auditFiltersFrom(await searchParams)} />
  </CapabilityPage>
);

export default Page;
