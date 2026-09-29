import { cn } from '@/utils/cn';

export interface LigneInfobulle {
  cle: string;
  libelle: string;
  valeur: string;
  couleur: string;
}

interface InfobulleProps {
  titre: string;
  lignes: LigneInfobulle[];
  total?: { libelle: string; valeur: string };
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Infobulle (spec 03 §5.7) : la valeur passe avant le libellé ; aucune valeur
 * exclusive (tout se retrouve dans la vue tableau).
 */
export function Infobulle({
  titre,
  lignes,
  total,
  className,
  style,
}: InfobulleProps) {
  return (
    <div
      role="status"
      className={cn(
        'pointer-events-none w-[220px] rounded-xl border border-border bg-popover px-3 py-2.5 shadow-soft',
        className,
      )}
      style={style}
    >
      <p className="text-[13px] leading-[18px] text-muted-foreground">
        {titre}
      </p>
      <ul className="mt-1.5 space-y-1">
        {lignes.map((l) => (
          <li key={l.cle} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-0.5 w-3 shrink-0 rounded-[1px]"
              style={{ background: l.couleur }}
            />
            <span className="w-[72px] shrink-0 text-right text-[15px] font-semibold leading-5 text-foreground tabular-nums">
              {l.valeur}
            </span>
            <span className="truncate text-[13px] leading-[18px] text-foreground/80">
              {l.libelle}
            </span>
          </li>
        ))}
      </ul>
      {total && (
        <div className="mt-1.5 flex items-center gap-2 border-t border-border pt-1.5">
          <span className="w-3 shrink-0" />
          <span className="w-[72px] shrink-0 text-right text-[15px] font-semibold leading-5 text-foreground tabular-nums">
            {total.valeur}
          </span>
          <span className="text-[13px] leading-[18px] text-foreground/80">
            {total.libelle}
          </span>
        </div>
      )}
    </div>
  );
}
