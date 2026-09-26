import type { Metadata } from 'next';

import { CapabilityPage } from '@/components/layouts/capability-page';
import { AuditJournal } from '@/features/audit/components/audit-journal';
import { auditFiltersFrom } from '@/features/audit/utils/filters';

export const metadata: Metadata = { title: 'Journal d’audit' };

type Props = {
  params: Promise<{ nodeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Journal d'audit d'un nœud (PLA-Audit, portée audit.voir) : ce nœud et son sous-arbre. */
const Page = async ({ params, searchParams }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  return (
    <CapabilityPage capacite="audit.voir" nodeId={nodeId}>
      <AuditJournal filters={auditFiltersFrom(await searchParams)} scopeNodeId={nodeId} />
    </CapabilityPage>
  );
};

export default Page;
