import { cn } from '@/utils/cn';

/** Présence sur Jàngu Bi : paroisse active (tenue par son secrétariat) ou simple fiche d'annuaire. */
export const ParishStatus = ({ active, className }: { active: boolean; className?: string }) => (
  <span className={cn('inline-flex items-center gap-2 text-sm', active ? 'font-medium text-ink' : 'text-ink-3', className)}>
    <span aria-hidden="true" className={cn('inline-block size-2 rounded-full', active ? 'bg-primary' : 'border border-ink-3')} />
    {active ? 'Active' : 'Fiche d’annuaire'}
  </span>
);
