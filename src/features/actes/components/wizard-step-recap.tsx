'use client';

import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';

import type { RequestOptions } from '../api/get-request-options';
import { MONTHS, sacramentOf, type WizardValues } from '../utils/wizard-schema';

type Props = {
  options: RequestOptions;
  file: File | null;
  followed: { id: string; name: string } | null;
  onEdit: (step: number) => void;
};

const Row = ({ term, children }: { term: string; children: React.ReactNode }) => (
  <div className="grid gap-1 border-b border-line py-3 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-4">
    <dt className="tnum text-meta text-ink-3">{term}</dt>
    <dd className="m-0 text-base text-ink">{children}</dd>
  </div>
);

/** Étape 4 : tout relire avant l'envoi. */
export const WizardStepRecap = ({ options, file, followed, onEdit }: Props) => {
  const { getValues } = useFormContext<WizardValues>();
  const v = getValues();
  const type = options.document_types.find((t) => t.value === v.document_type);
  const reason = options.reasons.find((r) => r.value === v.reason);
  const month = v.sacrament_month ? `${MONTHS[Number(v.sacrament_month) - 1].toLowerCase()} ` : '';

  return (
    <div>
      <dl className="m-0 border-t border-line-strong">
        <Row term="Acte demandé">{v.document_type === 'other' ? v.document_type_free : type?.label}</Row>
        <Row term="Paroisse du sacrement">{v.parish?.name}</Row>
        <Row term="Au nom de">
          {v.first_names} {v.last_name}
        </Row>
        <Row term="Naissance">
          {v.date_of_birth}, {v.place_of_birth}
        </Row>
        <Row term="Parents">
          {v.father} et {v.mother}
        </Row>
        <Row term={sacramentOf(v.document_type).title}>
          {month}
          {v.sacrament_year}
        </Row>
        <Row term="Motif">{v.reason === 'other' ? v.reason_free : reason?.label}</Row>
        <Row term="Pour vous joindre">
          {v.contact_phone} · {v.contact_email}
        </Row>
        {file && <Row term="Pièce jointe">{file.name}</Row>}
        <Row term="Retrait de l’original">
          {v.pickup_mode === 'transfer_to_followed_parish' && followed
            ? `Transmis à ma paroisse, ${followed.name}`
            : `Au secrétariat de ${v.parish?.name ?? 'la paroisse du sacrement'}`}
        </Row>
      </dl>
      <div className="mt-4 flex flex-wrap gap-6">
        <Button variant="tertiary" size="sm" onClick={() => onEdit(0)}>
          Modifier l’acte
        </Button>
        <Button variant="tertiary" size="sm" onClick={() => onEdit(1)}>
          Modifier la paroisse
        </Button>
        <Button variant="tertiary" size="sm" onClick={() => onEdit(2)}>
          Modifier les informations
        </Button>
      </div>
      <Notice title="Un original papier, jamais un fichier." className="mt-6">
        L’acte vous sera remis en original, signé par le curé et revêtu du sceau de la paroisse. Aucun acte n’est délivré par voie
        numérique.
      </Notice>
    </div>
  );
};
