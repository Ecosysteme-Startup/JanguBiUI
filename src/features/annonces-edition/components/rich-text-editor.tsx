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
  'min-h-[196px] px-[18px] py-4 text-16 leading-relaxed text-ink outline-none',
  '[&>*:first-child]:mt-0 [&_p]:mb-0 [&_p]:mt-3 [&_strong]:font-semibold',
  '[&_h2]:mb-1 [&_h2]:mt-5 [&_h2]:text-20 [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:mt-4 [&_h3]:text-17 [&_h3]:font-semibold',
  '[&_ul]:mb-0 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-[22px] [&_ol]:mb-0 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-[22px]',
  '[&_blockquote]:my-4 [&_blockquote]:font-serif [&_blockquote]:text-18 [&_blockquote]:italic [&_blockquote]:text-ink-2',
  '[&_a]:text-primary [&_a]:underline',
);

type ToolProps = { icon?: IconName; text?: string; label: string; active?: boolean; onClick: () => void };

const Tool = ({ icon, text, label, active, onClick }: ToolProps) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={active}
    title={label}
    onClick={onClick}
    className={cn(
      'hit inline-flex size-8 items-center justify-center rounded-8 text-15 font-semibold text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink',
      active && 'bg-surface-2 text-ink',
    )}
  >
    {icon ? <Icon name={icon} size={20} /> : text}
  </button>
);

const Separator = () => <span aria-hidden="true" className="mx-1.5 h-5 w-px bg-line" />;

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
      <label htmlFor={fieldId} className="flex flex-col gap-1 text-14 font-medium text-ink">
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
          className="h-9 w-72 max-w-full rounded-10 border border-line-field bg-paper px-3 text-14 font-normal text-ink"
        />
      </label>
      <Button size="sm" onClick={apply}>
        Appliquer
      </Button>
      <Button size="sm" variant="secondary" onClick={onDone}>
        Annuler
      </Button>
      {error && (
        <p role="alert" className="m-0 w-full text-13 text-err">
          {error}
        </p>
      )}
    </div>
  );
};

const Toolbar = ({ editor }: { editor: Editor }) => {
  const [linkOpen, setLinkOpen] = useState(false);
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      heading: e.isActive('heading', { level: 2 }),
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

  return (
    <>
      <div role="toolbar" aria-label="Mise en forme" className="flex flex-wrap items-center gap-0.5 border-b border-line bg-surface px-2 py-1.5">
        <Tool text="H" label="Intertitre" active={state.heading} onClick={() => chain().toggleHeading({ level: 2 }).run()} />
        <Tool text="B" label="Gras" active={state.bold} onClick={() => chain().toggleBold().run()} />
        <Tool text="I" label="Italique" active={state.italic} onClick={() => chain().toggleItalic().run()} />
        <Tool icon="liste" label="Liste à puces" active={state.bullet} onClick={() => chain().toggleBulletList().run()} />
        <Tool icon="liste-numerotee" label="Liste numérotée" active={state.ordered} onClick={() => chain().toggleOrderedList().run()} />
        <Separator />
        <Tool icon="lien" label="Lien" active={state.link || linkOpen} onClick={() => setLinkOpen((o) => !o)} />
        <Tool icon="citation" label="Citation" active={state.quote} onClick={() => chain().toggleBlockquote().run()} />
        <span className="tnum ml-auto pr-1 text-13 text-ink-3">{state.stats}</span>
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
    <div
      className={cn(
        'overflow-hidden rounded-12 border bg-paper',
        invalid
          ? 'border-err-line ring-1 ring-inset ring-err-line'
          : 'border-line-field focus-within:border-primary focus-within:ring-1 focus-within:ring-inset focus-within:ring-primary',
      )}
    >
      {editor ? <Toolbar editor={editor} /> : <div className="h-11 border-b border-line bg-surface" />}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
