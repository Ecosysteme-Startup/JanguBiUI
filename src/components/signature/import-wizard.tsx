'use client';

import * as React from 'react';

import { Stepper } from '@/components/signature/stepper';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { IconButton } from '@/components/ui/icon-button';
import { Notice } from '@/components/ui/notice';
import type { ImportReport } from '@/lib/import-report';
import { cn } from '@/utils/cn';
import { plural } from '@/utils/plural';

type LineStatus = ImportReport['lines'][number]['status'];

const TABS: { status: LineStatus; label: string }[] = [
  { status: 'error', label: 'Erreurs' },
  { status: 'warning', label: 'Avertissements' },
  { status: 'ok', label: 'Valides' },
];

const errorText = (error: unknown) => (error instanceof Error ? error.message : 'L’import a échoué. Réessayez.');

const sizeOf = (bytes: number) => `${(bytes / 1024).toFixed(1).replace('.', ',')} Ko`;

type ImportWizardProps = {
  /** Légende au-dessus du titre (« Assistant d'import · mouvement annuel »). */
  eyebrow: string;
  title: string;
  /** Colonnes attendues, affichées comme aide sous le champ fichier. */
  columns: string;
  /** Champs supplémentaires de l'étape 1 (date d'effet…). */
  extra?: React.ReactNode;
  /** Faux tant que les champs supplémentaires ne sont pas valides. */
  ready?: boolean;
  simulate: (file: File) => Promise<ImportReport>;
  apply: (file: File) => Promise<ImportReport>;
  /** Ce qui est inscrit au journal après application. */
  auditNote: string;
  onClose?: () => void;
};

/**
 * Import CSV en trois étapes (spec §4, DIO-Nominations) : fichier, simulation (dry_run),
 * application. Le backend applique en bloc : une seule ligne en erreur annule tout,
 * l'application n'est donc proposée que sur un fichier sans erreur.
 */
export const ImportWizard = ({ eyebrow, title, columns, extra, ready = true, simulate, apply, auditNote, onClose }: ImportWizardProps) => {
  const id = React.useId();
  const [file, setFile] = React.useState<File | null>(null);
  const [report, setReport] = React.useState<ImportReport | null>(null);
  const [applied, setApplied] = React.useState<ImportReport | null>(null);
  const [tab, setTab] = React.useState<LineStatus>('error');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fileError, setFileError] = React.useState<string | undefined>(undefined);

  const step = applied ? 2 : report ? 1 : 0;

  const run = async (action: () => Promise<void>) => {
    setPending(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setPending(false);
    }
  };

  const onSimulate = () => {
    if (!file) {
      setFileError('Choisissez un fichier CSV.');
      return;
    }
    void run(async () => {
      const result = await simulate(file);
      setReport(result);
      setTab(result.errors ? 'error' : result.warnings ? 'warning' : 'ok');
    });
  };

  const onApply = () => {
    if (!file) return;
    void run(async () => setApplied(await apply(file)));
  };

  const restart = () => {
    setFile(null);
    setReport(null);
    setApplied(null);
    setError(null);
  };

  const lines = report?.lines.filter((l) => l.status === tab) ?? [];
  const counts: Record<LineStatus, number> = {
    error: report?.errors ?? 0,
    warning: report?.warnings ?? 0,
    ok: (report?.valid ?? 0) - (report?.warnings ?? 0),
  };

  return (
    <section aria-labelledby={`${id}-titre`} className="flex flex-col gap-6 border border-line bg-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="tnum m-0 text-meta text-ink-2">{eyebrow}</p>
          <h2 id={`${id}-titre`} className="m-0 mt-2 font-serif text-h3 font-normal text-ink">
            {title}
          </h2>
        </div>
        {onClose && <IconButton icon="x" label="Fermer l’assistant" onClick={onClose} />}
      </div>

      <Stepper label="Étapes de l’import" steps={['Fichier', 'Aperçu des changements', 'Application et journal']} current={step} />

      {step === 0 && (
        <div className="flex flex-col gap-5">
          <Field
            id={`${id}-fichier`}
            label="Fichier CSV"
            required
            hint={`UTF-8, une ligne par élément. Colonnes : ${columns}.`}
            error={fileError}
          >
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setFileError(undefined);
              }}
              className="text-base text-ink file:mr-4 file:h-11 file:rounded file:border file:border-line-strong file:bg-transparent file:px-4 file:text-base file:text-ink"
            />
          </Field>
          {extra}
          <div>
            <Button onClick={onSimulate} disabled={pending || !ready}>
              {pending ? 'Simulation…' : 'Simuler l’import'}
            </Button>
          </div>
        </div>
      )}

      {step === 1 && report && (
        <div className="flex flex-col gap-5">
          {file && (
            <p className="tnum m-0 text-sm text-ink-2">
              Fichier déposé <span className="font-medium text-ink">{file.name}</span> · {plural(report.lines.length, 'ligne', 'lignes')} · {sizeOf(file.size)}{' '}
              ·{' '}
              <Button variant="tertiary" size="sm" className="h-auto" onClick={restart}>
                Remplacer
              </Button>
            </p>
          )}
          <dl className="m-0 grid grid-cols-3 gap-6 border-t border-line-strong">
            {[
              { label: 'Lignes valides', value: report.valid, hint: 'Applicables', tone: 'text-ink' },
              { label: 'Avertissements', value: report.warnings, hint: 'Applicables, à relire', tone: 'text-warn' },
              { label: 'Erreurs', value: report.errors, hint: 'Bloquantes : rien n’est appliqué', tone: 'text-err' },
            ].map((item) => (
              <div key={item.label} className="pt-3">
                <dt className="tnum text-meta text-ink-3">{item.label}</dt>
                <dd className={cn('m-0 mt-1 font-serif text-h2', item.tone)}>{item.value}</dd>
                <dd className="m-0 text-sm text-ink-2">{item.hint}</dd>
              </div>
            ))}
          </dl>

          <div role="group" aria-label="Aperçu des lignes" className="flex gap-6 border-b border-line">
            {TABS.map((t) => (
              <button
                key={t.status}
                type="button"
                aria-pressed={tab === t.status}
                onClick={() => setTab(t.status)}
                className={cn(
                  '-mb-px inline-flex h-11 items-center gap-2 border-b-2 text-base',
                  tab === t.status ? 'border-primary font-semibold text-ink' : 'border-transparent text-ink-2 hover:text-primary',
                )}
              >
                {t.label}
                <span className="tnum text-meta text-ink-3">{counts[t.status]}</span>
              </button>
            ))}
          </div>
          {lines.length ? (
            <ul className="m-0 flex max-h-80 list-none flex-col overflow-y-auto p-0">
              {lines.map((l) => (
                <li key={`${l.line}-${l.code}`} className="grid grid-cols-[56px_minmax(0,1fr)] gap-3 border-b border-line py-3">
                  <span className="tnum text-meta text-ink-3">L. {String(l.line).padStart(2, '0')}</span>
                  <span className="text-sm text-ink">
                    {l.code && <span className="font-medium">{l.code} · </span>}
                    {l.message}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-sm text-ink-3">Aucune ligne dans cette catégorie.</p>
          )}

          {report.errors > 0 ? (
            <Notice tone="err" title={`${report.errors} ligne${report.errors > 1 ? 's' : ''} en erreur`}>
              L’import est appliqué en bloc : corrigez le fichier puis déposez-le à nouveau.
            </Notice>
          ) : (
            <p className="m-0 text-sm text-ink-2">{auditNote}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={restart}>
              Déposer un autre fichier
            </Button>
            <Button onClick={onApply} disabled={pending || report.errors > 0 || report.valid === 0}>
              {pending ? 'Application…' : `Appliquer ${report.valid} ligne${report.valid > 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && applied && (
        <div className="flex flex-col gap-4">
          {applied.applied ? (
            <Notice tone="ok" title={`Import appliqué · ${applied.valid} ligne${applied.valid > 1 ? 's' : ''}`}>
              {auditNote}
            </Notice>
          ) : (
            <Notice tone="err" title="Import non appliqué">
              Le serveur a trouvé {applied.errors} erreur{applied.errors > 1 ? 's' : ''} : aucune ligne n’a été enregistrée.
            </Notice>
          )}
          <div>
            <Button variant="secondary" onClick={restart}>
              Nouvel import
            </Button>
          </div>
        </div>
      )}

      <div aria-live="polite">{error && <Notice tone="err" title={error} />}</div>
    </section>
  );
};
