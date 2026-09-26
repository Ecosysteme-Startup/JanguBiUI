import type { Reading } from '../api/get-liturgy-day';
import { sanitizeReadingHtml } from '../utils/sanitize-reading';

/** Texte d'une lecture : versets de la Bible locale, ou texte AELF nettoyé. */
export const ReadingText = ({ reading }: { reading: Reading }) => {
  if (reading.verses.length > 0) {
    return (
      <div className="flex flex-col gap-2 font-serif text-lead leading-[1.7] text-ink">
        {reading.verses.map((verse) => (
          <p key={`${verse.chapter}-${verse.number}`} className="m-0">
            <sup className="tnum mr-2 font-sans text-meta text-primary">{verse.number}</sup>
            {verse.text}
          </p>
        ))}
      </div>
    );
  }
  if (reading.text) {
    return (
      <div
        className="reading-html flex flex-col gap-3 font-serif text-lead leading-[1.7] text-ink [&_p]:m-0 [&_sup]:mr-1 [&_sup]:font-sans [&_sup]:text-meta [&_sup]:text-primary"
        // Texte AELF nettoyé par DOMPurify (balises de texte seulement, aucun attribut).
        dangerouslySetInnerHTML={{ __html: sanitizeReadingHtml(reading.text) }}
      />
    );
  }
  return <p className="m-0 text-base text-ink-2">Le texte de cette lecture n&apos;est pas encore disponible.</p>;
};
