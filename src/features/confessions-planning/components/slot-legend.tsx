/** Légende des états d'un créneau (maquette PAR-Confessions). */
export const SlotLegend = () => (
  <ul aria-label="Légende" className="m-0 flex list-none flex-wrap items-center gap-4 p-0 text-13 text-ink-2">
    <li className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className="h-3 w-4 rounded-[4px] border border-tint-200 bg-tint-100" />
      Réservé
    </li>
    <li className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className="h-3 w-4 rounded-[4px] border border-dashed border-line-field bg-paper" />
      Libre
    </li>
    <li className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className="h-3 w-4 rounded-[4px] bg-surface-2" />
      Fermé
    </li>
  </ul>
);
