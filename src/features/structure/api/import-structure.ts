import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { type ImportReport, importReportSchema } from '@/lib/import-report';

import { structureKeys } from './node-schema';

export type StructureImportKind = 'nodes' | 'places';

/** Import CSV de nœuds ou de lieux de culte (simulation par défaut : dry_run). */
export const importStructure = async ({
  kind,
  file,
  dryRun,
}: {
  kind: StructureImportKind;
  file: File;
  dryRun: boolean;
}): Promise<ImportReport> => {
  const form = new FormData();
  form.append('file', file);
  return importReportSchema.parse(await api.post(`/hierarchy/import/${kind}/`, form, { params: { dry_run: dryRun } }));
};

export const useImportStructure = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importStructure,
    onSuccess: (report) => {
      if (report.applied) void queryClient.invalidateQueries({ queryKey: structureKeys.all });
    },
  });
};
