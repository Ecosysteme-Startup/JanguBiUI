'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';

import { TopbarContent } from '@/components/layouts/shell-slots';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Modal } from '@/components/ui/modal';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { useBackofficePlaces } from '@/hooks/use-backoffice-places';
import { displayName, useMe } from '@/hooks/use-me';
import { useNode } from '@/hooks/use-node';
import { apiErrorCode, apiErrorMessage, apiFieldErrors, isForbidden } from '@/utils/api-errors';
import { dayjs, hour } from '@/utils/dates';
import { parishLabel } from '@/utils/parish-name';

import { useStaffArticle } from '../api/get-staff-article';
import { type SaveArticleInput, useDeleteArticle, useSaveArticle, useUnpublishArticle } from '../api/save-article';
import type { ArticleStatus, StaffArticle } from '../api/staff-article';
import { sanitizeArticleHtml, textToHtml } from '../utils/sanitize-html';

import { AppPreview } from './app-preview';
import { stamp, statusLabel } from './article-status';
import { ContentFields } from './content-fields';
import { type EditorValues, editorSchema } from './editor-schema';
import { EpinglagePanel } from './epinglage-panel';
import { PublicationPanel } from './publication-panel';

const STATUS_TONE: Record<ArticleStatus, BadgeTone> = { draft: 'neutral', scheduled: 'info', published: 'ok', unpublished: 'muted' };

/** « la paroisse Saint-Dominique » dans une phrase (« Rédigée par … pour la paroisse … »). */
const lowerParish = (name: string) => {
  const label = parishLabel(name);
  return /^paroisse /i.test(label) ? `la ${label.charAt(0).toLowerCase()}${label.slice(1)}` : label;
};

type Action = 'draft' | 'publish' | 'schedule' | 'save';

const SERVER_FIELDS: Record<string, keyof EditorValues> = {
  title: 'title',
  excerpt: 'excerpt',
  content: 'content',
  category_id: 'category_id',
  sunday_date: 'sunday_date',
  publish_at: 'publish_date',
  place_id: 'place_id',
  cover_image_id: 'cover_image_id',
  cover_image_alt: 'cover_image_alt',
};

/** Codes d'erreur métier rattachés à un champ du formulaire. */
const CODE_FIELDS: [prefix: string, field: keyof EditorValues][] = [
  ['sunday_date', 'sunday_date'],
  ['place_not_in_node', 'place_id'],
  ['cover_alt', 'cover_image_alt'],
  ['cover_', 'cover_image_id'],
  ['file_', 'cover_image_id'],
];

const defaultsOf = (article: StaffArticle | null): EditorValues => ({
  title: article?.title ?? '',
  excerpt: article?.excerpt ?? '',
  content: article ? (article.content_format === 'html' ? sanitizeArticleHtml(article.content) : textToHtml(article.content)) : '',
  content_type: article?.content_type === 'article' ? 'article' : 'announcement',
  is_sunday_notice: article?.is_sunday_notice ?? false,
  sunday_date: article?.sunday_date ?? '',
  category_id: article?.category ? String(article.category.id) : '',
  place_id: article?.scope.place_id ? String(article.scope.place_id) : '',
  cover_image_id: article?.cover_image_id ?? null,
  cover_image_url: article?.cover_image_url ?? null,
  cover_image_alt: article?.cover_image_alt ?? '',
  cover_image_decorative: article?.cover_image_decorative ?? false,
  notify_followers: article?.notify_followers ?? true,
  when: article?.status === 'scheduled' ? 'schedule' : 'now',
  publish_date: article?.publish_at ? dayjs(article.publish_at).format('YYYY-MM-DD') : '',
  publish_time: article?.publish_at ? dayjs(article.publish_at).format('HH:mm') : '12:00',
});

/** ISO de la publication programmée, ou message d'erreur si elle n'est pas dans le futur. */
export const scheduledAt = (values: Pick<EditorValues, 'publish_date' | 'publish_time'>, now = dayjs()): { iso: string } | { error: string } => {
  if (!values.publish_date || !values.publish_time) return { error: 'Indiquez la date et l’heure de publication.' };
  const at = dayjs(`${values.publish_date}T${values.publish_time}`);
  if (!at.isValid()) return { error: 'Date de publication invalide.' };
  if (!at.isAfter(now)) return { error: 'La publication programmée doit être dans le futur.' };
  return { iso: at.toISOString() };
};

const buildInput = (nodeId: string, article: StaffArticle | null, values: EditorValues, publish?: { at: string | null; notify?: boolean }): SaveArticleInput => {
  const common = {
    content_type: values.content_type,
    title: values.title.trim(),
    excerpt: values.excerpt.trim(),
    content: sanitizeArticleHtml(values.content),
    content_format: 'html' as const,
    category_id: Number(values.category_id),
    is_sunday_notice: values.is_sunday_notice,
    sunday_date: values.is_sunday_notice ? values.sunday_date : null,
    place_id: values.place_id ? Number(values.place_id) : null,
    cover_image_id: values.cover_image_id,
    // Bannière décorative : alternative vide ; sans bannière, rien à décrire.
    cover_image_alt: values.cover_image_id !== null && !values.cover_image_decorative ? values.cover_image_alt.trim() : '',
    cover_image_decorative: values.cover_image_id !== null && values.cover_image_decorative,
    notify_followers: values.notify_followers,
  };
  if (article) return { id: article.id, update: common, publish };
  return { id: null, create: { ...common, node_id: nodeId }, publish };
};

const heading = (article: StaffArticle | null, values: Pick<EditorValues, 'is_sunday_notice' | 'content_type'>) => {
  if (values.is_sunday_notice) return article ? 'Annonce du dimanche' : 'Nouvelle annonce du dimanche';
  if (!article) return values.content_type === 'article' ? 'Nouvel article' : 'Nouvelle annonce';
  return values.content_type === 'article' ? 'Article' : 'Annonce';
};

const applyServerErrors = (form: UseFormReturn<EditorValues>, error: unknown): boolean => {
  const fields = apiFieldErrors(error);
  let mapped = false;
  Object.entries(fields).forEach(([field, message]) => {
    const target = SERVER_FIELDS[field];
    if (target) {
      form.setError(target, { message });
      mapped = true;
    }
  });
  const code = apiErrorCode(error);
  const byCode = code ? CODE_FIELDS.find(([prefix]) => code.startsWith(prefix)) : undefined;
  if (byCode) {
    form.setError(byCode[1], { message: apiErrorMessage(error) });
    mapped = true;
  }
  return mapped;
};

type EditorFormProps = { nodeId: string; article: StaffArticle | null };

const EditorForm = ({ nodeId, article }: EditorFormProps) => {
  const router = useRouter();
  const places = useBackofficePlaces(nodeId);
  const form = useForm<EditorValues>({ resolver: zodResolver(editorSchema), defaultValues: defaultsOf(article) });
  const { handleSubmit, watch, setError } = form;
  const [pending, setPending] = useState<Action | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'delete' | 'unpublish' | null>(null);
  const [reason, setReason] = useState('');
  const listHref = paths.espace.annonces.list.getHref(nodeId);

  const save = useSaveArticle();
  const unpublish = useUnpublishArticle({
    onSuccess: () => {
      toast.ok('Annonce retirée : elle n’est plus visible des fidèles.');
      router.push(listHref);
    },
  });
  const remove = useDeleteArticle({
    onSuccess: () => {
      toast.ok('Annonce supprimée.');
      router.push(listHref);
    },
  });

  const when = watch('when');
  const isSunday = watch('is_sunday_notice');
  const contentType = watch('content_type');
  const status = article?.status ?? 'draft';
  const isLive = status === 'published';
  const canDelete = article !== null && (status === 'draft' || status === 'unpublished');
  const me = useMe();
  const node = useNode(nodeId);
  const nodeName = node.data?.name;
  const author = article?.author_name ?? (displayName(me.data).full || undefined);

  const run = (action: Action) =>
    handleSubmit(async (values) => {
      setFailure(null);
      let publish: { at: string | null; notify?: boolean } | undefined;
      if (action === 'schedule') {
        const at = scheduledAt(values);
        if ('error' in at) {
          setError('publish_date', { message: at.error });
          return;
        }
        publish = { at: at.iso, notify: values.notify_followers };
      } else if (action === 'publish') {
        publish = { at: null, notify: values.notify_followers };
      }
      setPending(action);
      try {
        const saved = await save.mutateAsync(buildInput(nodeId, article, values, publish));
        if (action === 'publish') {
          toast.ok('Annonce publiée : les fidèles la voient dans « Ma paroisse ».');
          router.push(listHref);
        } else if (action === 'schedule') {
          toast.ok(`Publication programmée : ${saved.publish_at ? stamp(saved.publish_at) : ''}.`);
          router.push(listHref);
        } else if (!article) {
          toast.ok('Brouillon enregistré.');
          router.replace(paths.espace.annonces.detail.getHref(nodeId, saved.id));
        } else {
          setSavedAt(hour(saved.updated_at));
        }
      } catch (error) {
        const mapped = applyServerErrors(form, error);
        setFailure(mapped ? 'Corrigez les champs signalés.' : apiErrorMessage(error));
      } finally {
        setPending(null);
      }
    })();

  const pageTitle = heading(article, { is_sunday_notice: isSunday, content_type: contentType });

  return (
    <form noValidate onSubmit={(e) => e.preventDefault()}>
      <TopbarContent start={<Breadcrumbs separator="slash" items={[{ label: 'Annonces', href: listHref }, { label: pageTitle }]} />} />
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="m-0 flex flex-wrap items-center gap-2" aria-live="polite">
            <Badge tone={STATUS_TONE[status]} dot>
              {statusLabel(status)}
            </Badge>
            <span className="tnum text-14 text-ink-3">
              {savedAt ? `Enregistré à ${savedAt}` : article ? `Modifié le ${dayjs(article.updated_at).format('D MMMM à H:mm')}` : 'Pas encore enregistré'}
            </span>
          </p>
          <h1 className="m-0 mt-2 text-32 font-semibold text-ink">{pageTitle}</h1>
          {(author || nodeName) && (
            <p className="m-0 mt-1 text-16 text-ink-2">
              {author ? `Rédigée par ${author}` : 'Rédigée'}
              {nodeName ? ` pour ${lowerParish(nodeName)}` : ''}.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:pt-8">
          {isLive ? (
            <>
              <Button variant="outline" className="min-h-11 text-14" onClick={() => setConfirm('unpublish')}>
                Retirer
              </Button>
              <Button className="min-h-11 px-5" onClick={() => run('save')} disabled={pending !== null}>
                {pending === 'save' ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </Button>
            </>
          ) : (
            <>
              {canDelete && (
                <Button variant="outline" className="min-h-11 text-14" aria-label="Supprimer le brouillon" onClick={() => setConfirm('delete')}>
                  <Icon name="corbeille" size={18} className="text-ink-2" /> Supprimer
                </Button>
              )}
              <Button variant="outline" className="min-h-11 text-14" onClick={() => run('draft')} disabled={pending !== null}>
                {pending === 'draft' ? 'Enregistrement…' : status === 'scheduled' ? 'Enregistrer' : 'Enregistrer le brouillon'}
              </Button>
              {when === 'schedule' ? (
                <Button className="min-h-11 px-5" onClick={() => run('schedule')} disabled={pending !== null}>
                  <Icon name="horloge" size={18} />
                  {pending === 'schedule' ? 'Programmation…' : 'Programmer la publication'}
                </Button>
              ) : (
                <Button className="min-h-11 px-5" onClick={() => run('publish')} disabled={pending !== null}>
                  {pending === 'publish' ? 'Publication…' : 'Publier maintenant'}
                </Button>
              )}
            </>
          )}
        </div>
      </header>

      {failure && (
        <p role="alert" className="m-0 mt-4 flex items-center gap-2 text-14 text-err">
          <Icon name="alerte" size={16} /> {failure}
        </p>
      )}

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_368px]">
        <ContentFields form={form} places={places.data ?? []} nodeLabel={nodeName ? parishLabel(nodeName) : 'Toute la paroisse'} />
        <aside aria-label="Aperçu et publication" className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6">
          <AppPreview form={form} nodeName={nodeName ?? ''} />
          <PublicationPanel form={form} article={article} />
          {article && <EpinglagePanel articleId={article.id} />}
        </aside>
      </div>

      <Modal
        open={confirm === 'delete'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Supprimer ce brouillon ?"
        description="Il sera définitivement effacé. Cette action ne peut pas être annulée."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Garder
            </Button>
            <Button variant="danger" disabled={remove.isPending} onClick={() => article && remove.mutate(article.id)}>
              {remove.isPending ? 'Suppression…' : 'Supprimer'}
            </Button>
          </>
        }
      >
        {remove.isError && (
          <p role="alert" className="m-0 text-sm text-err">
            {apiErrorMessage(remove.error)}
          </p>
        )}
      </Modal>

      <Modal
        open={confirm === 'unpublish'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Retirer cette annonce ?"
        description="Elle disparaît de « Ma paroisse » et de la fiche publique. Vous pourrez la republier."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Annuler
            </Button>
            <Button variant="danger" disabled={unpublish.isPending} onClick={() => article && unpublish.mutate({ id: article.id, reason })}>
              {unpublish.isPending ? 'Retrait…' : 'Retirer l’annonce'}
            </Button>
          </>
        }
      >
        <Field id="ed-motif" label="Motif (facultatif)" hint="Consigné dans le journal ; jamais montré aux fidèles.">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
        </Field>
        {unpublish.isError && (
          <p role="alert" className="m-0 mt-3 text-sm text-err">
            {apiErrorMessage(unpublish.error)}
          </p>
        )}
      </Modal>
    </form>
  );
};

/** PAR-Annonce-Editeur : création (`articleId = null`) ou modification d'un contenu du nœud. */
export const AnnonceEditor = ({ nodeId, articleId }: { nodeId: string; articleId: string | null }) => {
  const article = useStaffArticle(articleId);
  if (articleId && article.isPending) return <LoadingBlock label="Chargement de l’annonce…" lines={6} />;
  if (articleId && article.isError) {
    return (
      <EmptyState
        icon={isForbidden(article.error) ? 'cadenas' : 'alerte'}
        tone="err"
        title={isForbidden(article.error) ? 'Accès refusé' : 'Annonce introuvable'}
        action={<NextLink href={paths.espace.annonces.list.getHref(nodeId)}>Revenir aux annonces</NextLink>}
      >
        {apiErrorMessage(article.error)}
      </EmptyState>
    );
  }
  return <EditorForm key={article.data?.id ?? 'nouvelle'} nodeId={nodeId} article={article.data ?? null} />;
};
