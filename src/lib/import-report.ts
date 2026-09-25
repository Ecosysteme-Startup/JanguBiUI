import { z } from 'zod';

import type { Expect, Matches, ResponseBody } from '@/types/api-contract';

/** Rapport d'import CSV (nœuds, lieux, affectations) — ImportReportSerializer. */
export const importReportSchema = z.object({
  dry_run: z.boolean(),
  applied: z.boolean(),
  valid: z.number(),
  warnings: z.number(),
  errors: z.number(),
  lines: z.array(
    z.object({
      line: z.number(),
      status: z.enum(['ok', 'warning', 'error']),
      message: z.string(),
      code: z.string(),
    }),
  ),
});
export type ImportReport = z.infer<typeof importReportSchema>;

type _ImportReportMatchesContract = Expect<Matches<ImportReport, ResponseBody<'v1_hierarchy_import_nodes_create'>>>;
