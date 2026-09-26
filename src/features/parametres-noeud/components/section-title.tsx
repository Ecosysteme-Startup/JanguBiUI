/** Titre de section numéroté de PAR-Parametres (« 02 — Secrétariat »), indication à droite. */
export const SectionTitle = ({ id, number, children, aside }: { id: string; number: string; children: React.ReactNode; aside?: React.ReactNode }) => (
  <h2 id={id} className="tnum m-0 flex justify-between gap-4 border-t border-line-strong pt-2 text-meta font-normal text-ink-2">
    <span>
      <span className="text-primary">{number}</span> — {children}
    </span>
    {aside && <span className="text-ink-3">{aside}</span>}
  </h2>
);
