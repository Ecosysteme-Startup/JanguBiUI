import NextLink from 'next/link';

import { frenchTypo } from '@/utils/french-typo';

/** Carte éditoriale, sans boîte (DS-Composants §10). */
export const AnnouncementCard = ({
  number,
  kicker,
  tag,
  title,
  excerpt,
  author,
  href,
  headingLevel = 3,
}: {
  number?: string;
  kicker: string;
  tag?: string;
  title: string;
  excerpt?: string;
  author?: string;
  href: string;
  headingLevel?: 2 | 3;
}) => {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <article className="border-t border-line pt-3">
      <p className="tnum m-0 flex justify-between text-meta text-ink-3">
        <span>
          {number && <span className="text-primary">{number}</span>}
          {number && ' — '}
          {kicker}
        </span>
        {tag && <span>{tag}</span>}
      </p>
      <Heading className="m-0 mt-2 font-serif text-h3 font-normal">
        <NextLink href={href} className="text-ink hover:text-primary">
          {frenchTypo(title)}
        </NextLink>
      </Heading>
      {excerpt && <p className="m-0 mt-2 text-body text-ink-2">{frenchTypo(excerpt)}</p>}
      <p className="m-0 mt-2 flex items-center justify-between text-sm text-ink-3">
        <span>{author}</span>
        <NextLink href={href} className="font-medium text-primary" aria-hidden="true" tabIndex={-1}>
          Lire l&apos;annonce →
        </NextLink>
      </p>
    </article>
  );
};
