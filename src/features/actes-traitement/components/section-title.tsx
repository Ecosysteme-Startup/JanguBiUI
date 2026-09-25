/** En-tête de bloc numéroté (filet d'encre, numéro bleu, indication à droite). */
export const SectionTitle = ({ id, n, title, aside }: { id: string; n: string; title: string; aside?: React.ReactNode }) => (
  <div className="tnum mb-4 flex items-baseline justify-between gap-4 border-t border-line-strong pt-3 text-meta text-ink-2">
    <h2 id={id} className="m-0 text-meta font-normal">
      <span className="text-primary">{n}</span> — {title}
    </h2>
    {aside && <span className="text-ink-3">{aside}</span>}
  </div>
);
