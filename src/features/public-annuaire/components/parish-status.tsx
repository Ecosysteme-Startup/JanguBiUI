import { Badge } from '@/components/ui/badge';

/** Présence sur Jàngu Bi : « Sur Jàngu Bi » (tenue par son secrétariat) ou « Annuaire diocésain ». */
export const ParishStatus = ({ active, className }: { active: boolean; className?: string }) =>
  active ? (
    <Badge tone="ok" className={className}>
      Sur Jàngu Bi
    </Badge>
  ) : (
    <span className={className ? `text-13 text-ink-3 ${className}` : 'text-13 text-ink-3'}>Annuaire diocésain</span>
  );
