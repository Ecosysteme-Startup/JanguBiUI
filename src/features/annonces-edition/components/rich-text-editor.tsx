'use client';

import { type Editor, EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

import { readingStats, sanitizeArticleHtml } from '../utils/sanitize-html';

type RichTextEditorProps = {
  id: string;
  label: string;
  /** HTML initial (déjà assaini). Lu au montage seulement. */
  initialHtml: string;
  /** Reçoit le HTML ASSAINI à chaque modification. */
  onChange: (html: string) => void;
  invalid?: boolean;
  describedBy?: string;
};

/** Styles du contenu : ceux de la lecture fidèle (FID-Annonce), en tokens. */
const contentClasses = cn(
  'min-h-72 px-5 py-4 text-body text-ink outline-none',
  '[&_p]:my-3 [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:font-serif [&_h2]:text-h3 [&_h2]:font-normal',
  '[&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:font-serif [&_h3]:text-h4 [&_h3]:font-normal',
  '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6',
  '[&_blockquote]:my-4 [&_blockquote]:border-l-0 [&_blockquote]:font-serif [&_blockquote]:text-lead [&_blockquote]:italic [&_blockquote]:text-ink-2',
  '[&_a]:text-primary [&_a]:underline',
);

const STYLES = [
  { value: 'p', label: 'Paragraphe' },
  { value: 'h2', label: 'Titre de section' },
  { value: 'h3', label: 'Sous-titre' },
] as const;

type ToolProps = { icon?: IconName; text?: string; label: string; active?: boolean; onClick: () => void };

const Tool = ({ icon, text, label, active, onClick }: ToolProps) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={active}
    title={label}
    onClick={onClick}
    className={cn(
      'hit inline-flex size-9 items-center justify-center rounded text-base text-ink transition-colors hover:bg-surface-2',
      active && 'bg-tint-50 text-primary-strong',
    )}
  >
    {icon ? <Icon name={icon} size={20} /> : text}
  </button>
);

const Separator = () => <span aria-hidden="true" className="mx-1 h-6 w-px bg-line" />;

const LinkField = ({ editor, onDone }: { editor: Editor; onDone: () => void }) => {
  const fieldId = useId();
  const [href, setHref] = useState<string>(() => (editor.getAttributes('link').href as string | undefined) ?? 'https://');
  const [error, setError] = useState<string | null>(null);
  const apply = () => {
    const value = href.trim();
    if (!value || value === 'https://') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      onDone();
      return;
    }
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(value)) {
      setError('Adresse commençant par https://, mailto: ou tel:.');
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: value }).run();
    onDone();
  };
  return (
    <div className="flex flex-wrap items-end gap-2 border-b border-line bg-surface px-3 py-2">
      <label htmlFor={fieldId} className="flex flex-col gap-1 text-sm font-semibold text-ink">
        Adresse du lien
        <input
          id={fieldId}
          type="url"
          value={href}
          onChange={(e) => setHref(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              apply();
            }
          }}
          aria-invalid={error ? true : undefined}
          className="h-9 w-72 rounded border border-line-field bg-paper px-2 text-sm font-normal text-ink"
        />
      </label>
      <Button size="sm" onClick={apply}>
        Appliquer
      </Button>
      <Button size="sm" variant="secondary" onClick={onDone}>
        Annuler
      </Button>
      {error && (
        <p role="alert" className="m-0 w-full text-sm text-err">
          {error}
        </p>
      )}
    </div>
  );
};

const Toolbar = ({ editor }: { editor: Editor }) => {
  const styleId = useId();
  const [linkOpen, setLinkOpen] = useState(false);
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      style: e.isActive('heading', { level: 2 }) ? 'h2' : e.isActive('heading', { level: 3 }) ? 'h3' : 'p',
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      link: e.isActive('link'),
      quote: e.isActive('blockquote'),
      stats: readingStats(e.getHTML()),
    }),
  });
  const chain = () => editor.chain().focus();
  const setStyle = (value: string) => {
    if (value === 'p') chain().setParagraph().run();
    else chain().setHeading({ level: value === 'h2' ? 2 : 3 }).run();
  };

  return (
    <>
      <div role="toolbar" aria-label="Mise en forme" className="flex flex-wrap items-center gap-1 border-b border-line bg-surface px-2 py-1.5">
        <label htmlFor={styleId} className="sr-only">
          Style de paragraphe
        </label>
        <select
          id={styleId}
          value={state.style}
          onChange={(e) => setStyle(e.target.value)}
          className="h-9 rounded border border-line bg-paper px-2 text-sm text-ink"
        >
          {STYLES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <Separator />
        <Tool text="B" label="Gras" active={state.bold} onClick={() => chain().toggleBold().run()} />
        <Tool text="I" label="Italique" active={state.italic} onClick={() => chain().toggleItalic().run()} />
        <Separator />
        <Tool icon="liste" label="Liste à puces" active={state.bullet} onClick={() => chain().toggleBulletList().run()} />
        <Tool icon="liste-numerotee" label="Liste numérotée" active={state.ordered} onClick={() => chain().toggleOrderedList().run()} />
        <Separator />
        <Tool icon="lien" label="Lien" active={state.link || linkOpen} onClick={() => setLinkOpen((o) => !o)} />
        <Tool icon="citation" label="Citation" active={state.quote} onClick={() => chain().toggleBlockquote().run()} />
        <span className="tnum ml-auto pr-2 text-meta text-ink-3">{state.stats}</span>
      </div>
      {linkOpen && <LinkField editor={editor} onDone={() => setLinkOpen(false)} />}
    </>
  );
};

/**
 * Éditeur riche des annonces (TipTap), enveloppé pour pouvoir changer de bibliothèque
 * sans toucher aux écrans. Sortie : HTML assaini (DOMPurify), jamais le HTML brut.
 */
export const RichTextEditor = ({ id, label, initialHtml, onChange, invalid, describedBy }: RichTextEditorProps) => {
  const attributes = (): Record<string, string> => ({
    id,
    role: 'textbox',
    'aria-multiline': 'true',
    'aria-label': label,
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
    ...(invalid ? { 'aria-invalid': 'true' } : {}),
    class: contentClasses,
  });
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, autolink: true, protocols: ['mailto', 'tel'], HTMLAttributes: { rel: null, target: null } },
      }),
    ],
    content: initialHtml,
    editorProps: { attributes: attributes() },
    onUpdate: ({ editor: e }) => onChange(sanitizeArticleHtml(e.getHTML())),
  });

  // L'état d'erreur change après le montage : on met à jour les attributs sans recréer l'éditeur.
  useEffect(() => {
    editor?.setOptions({ editorProps: { attributes: attributes() } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, invalid, describedBy]);

  return (
    <div className={cn('rounded border bg-paper', invalid ? 'border-2 border-err' : 'border-line-field')}>
      {editor ? <Toolbar editor={editor} /> : <div className="h-12 border-b border-line bg-surface" />}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
