import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

import type { Authorization } from '../../types/schemas';
import { authorizationLabel } from '../../utils/format';

/** « 1er juin » : ordinal en exposant, comme dans les maquettes. */
const withOrdinal = (text: string) =>
  text.split(/(\b1er\b)/).map((part, i) =>
    part === '1er' ? (
      <span key={i}>
        1<sup className="text-[0.7em] leading-none">er</sup>
      </span>
    ) : (
      part
    ),
  );

/** Mention d'autorisation diocésaine (H4), icône bouclier en vert : visible partout où l'on donne. */
export const AuthorizationNote = ({
  authorization,
  compact = false,
  className,
}: {
  authorization: Pick<Authorization, 'text'> | null | undefined;
  /** Encarts latéraux (Soutenir la paroisse, campagne) : 13/18 ink-3, bouclier 14. */
  compact?: boolean;
  className?: string;
}) => {
  const text = authorizationLabel(authorization);
  if (!text) return null;
  return (
    <p
      className={cn(
        'flex items-start',
        compact ? 'gap-1.5 text-13 text-ink-3' : 'gap-2 text-14 text-ink-2',
        className,
      )}
    >
      <Icon
        name="bouclier"
        size={compact ? 14 : 16}
        className={'mt-0.5 shrink-0 text-ok'}
      />
      <span>{withOrdinal(text)}</span>
    </p>
  );
};
