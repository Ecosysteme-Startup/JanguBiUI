import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';

import { cn } from '@/utils/cn';

import { DONATION_STATUSES, type DonationStatus } from '../../types/schemas';
import { fcfa, progressPercent } from '../../utils/format';
import { AmountPills } from '../donner/donation-controls';

import { DonationStatusBadge } from './donation-status-badge';
import { FundProgress } from './fund-progress';

/** WEB-Design-System, « Statuts de paiement » : six statuts, pilules de montant, avancement d'une campagne. */
const meta: Meta = { title: 'Dons/Statuts de paiement' };
export default meta;

const MEANING: Record<DonationStatus, string> = {
  initie: 'Référence créée, fidèle envoyé chez l’agrégateur',
  en_attente: 'L’opérateur n’a pas encore confirmé le paiement',
  confirme: 'Notification signée reçue, reçu numéroté émis',
  echoue: 'Refusé ou annulé chez l’opérateur, rien n’est débité',
  rembourse: 'Montant rendu au fidèle, reçu annulé',
  expire: 'Page de paiement non finalisée à temps',
};

const Amounts = () => {
  const [value, setValue] = useState<number | null>(5000);
  return <AmountPills amounts={[1000, 2000, 5000, 10000]} value={value} onChange={setValue} name="ds-montant" />;
};

const Planche = () => (
  <div className="flex max-w-2xl flex-col gap-8">
    <ul className="m-0 list-none rounded-16 border border-line p-0">
      {DONATION_STATUSES.map((status, i) => (
        <li key={status} className={cn('grid grid-cols-[190px_minmax(0,1fr)] items-center gap-4 px-6 py-3', i > 0 && 'border-t border-line')}>
          <span>
            <DonationStatusBadge status={status} />
          </span>
          <span className="text-14 text-ink-2">{MEANING[status]}</span>
        </li>
      ))}
    </ul>
    <Amounts />
    <div className="tnum flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <FundProgress raised={1_186_400} goal={4_500_000} className="flex-1" />
        <span className="text-14 font-semibold">{progressPercent(1_186_400, 4_500_000)}&nbsp;%</span>
      </div>
      <span className="text-14 text-ink-2">
        {fcfa(1_186_400)} réunis sur {fcfa(4_500_000)}
      </span>
    </div>
  </div>
);

export const Clair: StoryObj = { render: () => <Planche />, globals: { mode: 'clair' } };
export const Sombre: StoryObj = { render: () => <Planche />, globals: { mode: 'sombre' } };
