import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { type ImportReport, importReportSchema } from '@/lib/import-report';

/** Mouvement annuel des affectations (CSV : action, email, office, node_code…). */
export const importAssignments = async ({
  file,
  effectiveDate,
  dryRun,
}: {
  file: File;
  effectiveDate: string;
  dryRun: boolean;
}): Promise<ImportReport> => {
  const form = new FormData();
  form.append('file', file);
  return importReportSchema.parse(
    await api.post('/hierarchy/assignments/import/', form, { params: { dry_run: dryRun, effective_date: effectiveDate } }),
  );
};

export const useImportAssignments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importAssignments,
    onSuccess: (report) => {
      if (report.applied) void queryClient.invalidateQueries({ queryKey: ['nominations'] });
    },
  });
};
