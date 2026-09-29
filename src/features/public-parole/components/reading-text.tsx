import type { Reading } from '../api/get-liturgy-day';
import { sanitizeReadingHtml } from '../utils/sanitize-reading';

/** Texte d'une lecture (Source Serif 20/32) : versets de la Bible locale, ou texte AELF nettoyé. */
export const ReadingText = ({ reading }: { reading: Reading }) => {
  if (reading.verses.length > 0) {
    return (
      <div className="flex flex-col gap-3 font-serif text-20 leading-8 text-ink">
        {reading.verses.map((verse) => (
          <p key={`${verse.chapter}-${verse.number}`} className="m-0">
            <sup className="tnum mr-1.5 font-sans text-12 text-ink-3">{verse.number}</sup>
            {verse.text}
          </p>
        ))}
      </div>
    );
  }
  if (reading.text) {
    return (
      <div
        className="reading-html flex flex-col gap-3 font-serif text-20 leading-8 text-ink [&_p]:m-0 [&_sup]:mr-1.5 [&_sup]:font-sans [&_sup]:text-12 [&_sup]:text-ink-3"
        // Texte AELF nettoyé par DOMPurify (balises de texte seulement, aucun attribut).
        dangerouslySetInnerHTML={{ __html: sanitizeReadingHtml(reading.text) }}
      />
    );
  }
  return <p className="m-0 text-16 text-ink-2">Le texte de cette lecture n&apos;est pas encore disponible.</p>;
};
