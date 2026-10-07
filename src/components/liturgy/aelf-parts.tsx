import { type AelfLecture, aelfParts } from '@/utils/aelf';
import { cn } from '@/utils/cn';
import { sanitizeAelfHtml } from '@/utils/sanitize-aelf';

/** Fragment AELF (texte ou HTML) affiché tel quel, après assainissement. */
const AelfHtml = ({ html, className }: { html: string; className?: string }) => (
  <div className={cn('[&_p]:m-0', className)} dangerouslySetInnerHTML={{ __html: sanitizeAelfHtml(html) }} />
);

/** Introduction lue (`aelf.intro_lue`), au-dessus du texte ; rien si AELF ne la fournit pas. */
export const AelfIntro = ({ aelf, className }: { aelf: AelfLecture; className?: string }) => {
  const { intro } = aelfParts(aelf);
  return intro ? <AelfHtml html={intro} className={cn('italic text-ink-2', className)} /> : null;
};

/**
 * Refrain psalmique (`aelf.refrain_psalmique` + `ref_refrain`) et acclamation de l'Évangile
 * (`aelf.verset_evangile` + `ref_verset`) : seulement les champs envoyés par l'AELF.
 */
export const AelfResponses = ({ aelf, className }: { aelf: AelfLecture; className?: string }) => {
  const { refrain, refRefrain, acclamation, refAcclamation } = aelfParts(aelf);
  if (!refrain && !acclamation) return null;
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {refrain && (
        <div data-aelf="refrain">
          <p className="m-0 font-sans text-13 text-ink-3">Refrain{refRefrain ? ` (${refRefrain})` : ''}</p>
          <AelfHtml html={refrain} className="mt-1 font-semibold" />
        </div>
      )}
      {acclamation && (
        <div data-aelf="acclamation">
          <p className="m-0 font-sans text-13 text-ink-3">Acclamation{refAcclamation ? ` (${refAcclamation})` : ''}</p>
          <AelfHtml html={acclamation} className="mt-1" />
        </div>
      )}
    </div>
  );
};
