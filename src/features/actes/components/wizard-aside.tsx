'use client';

import { useFormContext } from 'react-hook-form';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { ofParish } from '@/utils/parish-name';

import type { RequestOptions } from '../api/get-request-options';
import { MONTHS, sacramentOf, type WizardValues } from '../utils/wizard-schema';

const Row = ({ term, children, onEdit, label }: { term: string; children: React.ReactNode; onEdit?: () => void; label?: string }) => (
  <div className="border-t border-line py-3">
    <dt className="flex items-start justify-between gap-3 text-13 text-ink-3">
      {term}
      {onEdit && (
        <button type="button" onClick={onEdit} className="hit shrink-0 text-14 font-medium text-primary hover:text-primary-strong" aria-label={label}>
          Modifier
        </button>
      )}
    </dt>
    {children}
  </div>
);

/** Récapitulatif collant (FID-Demande-Nouvelle) : ce qui est déjà choisi, l'original papier, la confidentialité. */
export const WizardAside = ({ options, onEdit, className }: { options: RequestOptions; onEdit: (step: number) => void; className?: string }) => {
  const { watch } = useFormContext<WizardValues>();
  const v = watch();
  const type = v.document_type === 'other' && v.document_type_free ? v.document_type_free : options.document_types.find((t) => t.value === v.document_type)?.label;
  const reason = v.reason === 'other' && v.reason_free ? v.reason_free : options.reasons.find((r) => r.value === v.reason)?.label;
  const person = [v.first_names, v.last_name].filter(Boolean).join(' ');
  const [dd, mm, yyyy] = v.date_of_birth.split('/');
  const born = /^\d{2}\/\d{2}\/\d{4}$/.test(v.date_of_birth) ? dayjs(`${yyyy}-${mm}-${dd}`).format('D MMMM YYYY') : null;
  const sacrament = sacramentOf(v.document_type);
  const when = v.sacrament_year ? `${v.sacrament_month ? `${MONTHS[Number(v.sacrament_month) - 1].toLowerCase()} ` : ''}${v.sacrament_year}` : null;
  const pickup = v.pickup_mode === 'transfer_to_followed_parish' ? 'transmis à ma paroisse' : 'au secrétariat';

  return (
    <aside aria-labelledby="dn-recap" className={cn('flex-col gap-4 lg:sticky lg:top-6', className)}>
      <div className="rounded-16 border border-line bg-surface p-6">
        <h2 id="dn-recap" className="m-0 text-18 font-semibold text-ink">
          Votre demande
        </h2>
        <dl className="m-0 mt-4">
          <Row term="Acte demandé" onEdit={type ? () => onEdit(0) : undefined} label="Modifier l’acte demandé">
            <dd className="m-0 mt-0.5 text-15 font-semibold text-ink">{type ?? '—'}</dd>
          </Row>
          <Row term="Paroisse du sacrement" onEdit={v.parish ? () => onEdit(1) : undefined} label="Modifier la paroisse du sacrement">
            <dd className="m-0 mt-0.5 text-15 font-semibold text-ink">{v.parish?.name ?? '—'}</dd>
            {v.parish && (v.parish.address || v.parish.city) && (
              <dd className="m-0 text-14 text-ink-2">{[v.parish.address, v.parish.city].filter(Boolean).join(', ')}</dd>
            )}
          </Row>
          {person && (
            <Row term="Au nom de">
              <dd className="m-0 mt-0.5 text-15 font-semibold text-ink">{person}</dd>
              {born && <dd className="m-0 text-14 text-ink-2">Né(e) le {born}</dd>}
              {when && <dd className="m-0 text-14 text-ink-2">{sacrament.title} vers {when}</dd>}
            </Row>
          )}
          {reason && (
            <Row term="Motif et retrait">
              <dd className="m-0 mt-0.5 text-15 font-semibold text-ink">
                {reason} · {pickup}
              </dd>
            </Row>
          )}
        </dl>
      </div>
      <div role="note" className="rounded-16 bg-tint-50 px-6 py-5 text-tint-900">
        <p className="m-0 flex items-center gap-2 text-15 font-semibold">
          <Icon name="info" size={18} />
          Un original papier, à retirer
        </p>
        <p className="m-0 mt-2 text-14">
          L’acte est un original signé et scellé par la paroisse. Aucun document n’est envoyé par Jàngu Bi : vous serez prévenu ici dès qu’il
          sera prêt à retirer.
        </p>
      </div>
      <p className="m-0 flex items-start gap-2 px-2 text-13 text-ink-3">
        <Icon name="cadenas" size={16} className="mt-px shrink-0" />
        Ces informations ne sont transmises qu’au secrétariat {v.parish ? ofParish(v.parish.name) : 'de la paroisse du sacrement'}.
      </p>
    </aside>
  );
};
