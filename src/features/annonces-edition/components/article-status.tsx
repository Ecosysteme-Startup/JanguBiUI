import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import type { ArticleStatus, StaffArticle } from '../api/staff-article';

const STATUS: Record<ArticleStatus, { label: string; text: string; dot: string }> = {
  draft: { label: 'Brouillon', text: 'text-ink-2', dot: 'border-[1.5px] border-ink-3' },
  scheduled: { label: 'Programmée', text: 'font-medium text-primary', dot: 'border-[1.5px] border-primary' },
  published: { label: 'Publiée', text: 'font-medium text-ink', dot: 'bg-ink' },
  unpublished: { label: 'Retirée', text: 'text-ink-3', dot: 'bg-ink-3' },
};

export const statusLabel = (status: ArticleStatus) => STATUS[status].label;

/** « Dim. 27.09 · 6 h 00 » */
export const stamp = (iso: string) => {
  const d = dayjs(iso);
  const day = d.format('ddd DD.MM');
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${d.hour()} h ${d.format('mm')}`;
};

/** Précision sous l'état : échéance de programmation, date de publication, dernière modification. */
const detailOf = (article: StaffArticle): string => {
  if (article.status === 'scheduled' && article.publish_at) return stamp(article.publish_at);
  if (article.status === 'published' && article.published_at) return stamp(article.published_at);
  if (article.status === 'unpublished' && article.unpublished_at) return `Retirée le ${dayjs(article.unpublished_at).format('DD.MM')}`;
  return `Modifié le ${dayjs(article.updated_at).format('DD.MM')}`;
};

/** État d'une annonce (point + libellé) et sa précision, comme dans PAR-Annonces. */
export const ArticleStatusCell = ({ article }: { article: StaffArticle }) => {
  const style = STATUS[article.status];
  return (
    <>
      <span className={cn('inline-flex items-center gap-2 text-sm', style.text)}>
        <span aria-hidden="true" className={cn('inline-block size-2 shrink-0 rounded-full', style.dot)} />
        {style.label}
      </span>
      <span className="tnum mt-0.5 block text-meta text-ink-3">{detailOf(article)}</span>
    </>
  );
};
