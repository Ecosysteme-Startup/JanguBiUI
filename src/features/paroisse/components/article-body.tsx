import { frenchTypo } from '@/utils/french-typo';

import { articleBody } from '../utils/article-content';

const PROSE =
  'text-17 leading-7 text-ink [&>*:first-child]:mt-0 [&_a]:text-primary [&_a]:underline [&_blockquote]:mt-4 [&_blockquote]:text-ink-2 [&_blockquote]:italic [&_h2]:mt-8 [&_h2]:text-20 [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-17 [&_h3]:font-semibold [&_li]:mt-1 [&_ol]:mt-4 [&_ol]:pl-6 [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:pl-6';

/** Corps d'une annonce (17/28) : HTML nettoyé (DOMPurify) ou texte brut en paragraphes. */
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
