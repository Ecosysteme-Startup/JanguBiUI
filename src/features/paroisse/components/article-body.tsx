import { frenchTypo } from '@/utils/french-typo';

import { articleBody } from '../utils/article-content';

const PROSE =
  'max-w-reading text-body text-ink [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-0 [&_blockquote]:font-serif [&_blockquote]:text-lead [&_blockquote]:italic [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-h3 [&_h2]:font-normal [&_h3]:mt-6 [&_h3]:font-serif [&_h3]:text-h4 [&_h3]:font-normal [&_li]:mt-1 [&_ol]:pl-6 [&_p]:mt-4 [&_ul]:pl-6';

/** Corps d'une annonce : HTML nettoyé (DOMPurify) ou texte brut en paragraphes. */
export const ArticleBody = ({ content, format }: { content: string; format: 'text' | 'html' }) => {
  const body = articleBody(content, format);
  if (body.kind === 'html') {
    // HTML nettoyé par sanitizeArticleHtml (liste blanche de balises, aucun attribut d'événement).
    return <div className={PROSE} data-testid="corps-annonce" dangerouslySetInnerHTML={{ __html: body.html }} />;
  }
  return (
    <div className={PROSE} data-testid="corps-annonce">
      {body.paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {frenchTypo(p)}
        </p>
      ))}
    </div>
  );
};
