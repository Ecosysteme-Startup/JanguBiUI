import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';

import { AnnouncementCard } from './announcement-card';
import { CapabilityChips } from './capability-chips';
import { ConfessionNotice } from './confession-notice';
import { EncryptionBadge } from './encryption-badge';
import { LiturgicalBanner } from './liturgical-banner';
import { PhotoSlot } from './photo-slot';
import { RequestTimeline } from './request-timeline';
import { ScheduleWeek } from './schedule-week';
import { SlotPicker } from './slot-picker';
import { REQUEST_STATUS, StatusDot, type RequestStatus } from './status-dot';
import { Stepper } from './stepper';
import { TreeView } from './tree-view';

const meta: Meta = { title: 'Signature' };
export default meta;

const banner = {
  date: '2026-09-24',
  celebration: 'Jeudi de la 25e semaine du temps ordinaire',
  color: 'vert',
  references: ['Ec 1, 2-11', 'Ps 89 (90)', 'Lc 9, 7-9'],
};

export const BandeauLiturgique: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-6">
      <LiturgicalBanner data={banner} href="#" />
      <LiturgicalBanner data={banner} href="#" variant="backoffice" />
      <div className="w-[390px]">
        <LiturgicalBanner data={banner} href="#" variant="mobile" />
      </div>
    </div>
  ),
};

export const EmplacementPhoto: StoryObj = {
  render: () => <PhotoSlot slot="ds-nef" caption="Lumière du matin dans la nef, Saint-Dominique" className="max-w-md" />,
};

export const Statuts: StoryObj = {
  render: () => (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {(Object.keys(REQUEST_STATUS) as RequestStatus[]).map((s) => (
        <li key={s}>
          <StatusDot status={s} />
        </li>
      ))}
    </ul>
  ),
};

export const SuiviDeDemande: StoryObj = {
  render: () => (
    <div className="max-w-sm">
      <RequestTimeline
        label="Suivi de la demande JB-2026-00412"
        steps={[
          { key: '1', when: 'Lun. 21.09 · 10 h 14', title: 'Demande soumise', detail: 'Transmise à Sainte-Thérèse de Grand-Dakar.', state: 'done' },
          { key: '2', when: 'Depuis mar. 22.09', title: 'En vérification dans le registre', state: 'current' },
          { key: '3', when: 'À venir', title: 'Prête à retirer au secrétariat', state: 'upcoming' },
        ]}
      />
    </div>
  ),
};

export const Messagerie: StoryObj = {
  render: () => (
    <div className="flex max-w-2xl flex-col gap-3">
      <ConfessionNotice bookingHref="#" />
      <EncryptionBadge correspondent="l\u2019Abbé Augustin Ndiaye" />
    </div>
  ),
};

const SlotDemo = () => {
  const [selected, setSelected] = useState<number | null>(2);
  return (
    <SlotPicker
      label="Créneaux du samedi 26 septembre"
      selectedId={selected}
      onSelect={setSelected}
      slots={[
        { id: 1, startsAt: '2026-09-26T16:00:00', priest: 'A. Ndiaye', available: true },
        { id: 2, startsAt: '2026-09-26T16:20:00', priest: 'A. Ndiaye', available: true },
        { id: 3, startsAt: '2026-09-26T16:40:00', priest: 'A. Ndiaye', available: false },
        { id: 4, startsAt: '2026-09-26T17:00:00', priest: 'E. Tine', available: true },
      ]}
    />
  );
};

export const Creneaux: StoryObj = { render: () => <SlotDemo /> };

export const CarteAnnonce: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <AnnouncementCard
        number="01"
        kicker="Dimanche 27 septembre"
        tag="Quête"
        title="Quête impérée pour le Grand Séminaire de Brin, à toutes les messes"
        excerpt="Le produit de la quête est entièrement reversé au Grand Séminaire de Brin."
        author="Abbé Augustin Ndiaye, curé"
        href="#"
      />
    </div>
  ),
};

export const Horaires: StoryObj = {
  render: () => (
    <ScheduleWeek
      today={3}
      entries={[
        { weekday: 6, time: '8 h', label: 'Messe' },
        { weekday: 6, time: '10 h 30', label: 'Messe' },
        { weekday: 5, time: '18 h 30', label: 'Messe anticipée' },
        { weekday: 3, time: '7 h', label: 'Messe' },
      ]}
    />
  ),
};

export const EtapesEtCapacites: StoryObj = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-6">
      <Stepper label="Étapes de la demande" steps={['Type d\u2019acte', 'Paroisse', 'Informations', 'Récapitulatif']} current={1} />
      <CapabilityChips capabilities={['annonces.publier', 'actes.traiter', 'confessions.gerer']} />
    </div>
  ),
};

const TreeDemo = () => {
  const [selected, setSelected] = useState('dak');
  return (
    <TreeView
      label="Arbre des juridictions"
      selectedId={selected}
      onSelect={setSelected}
      defaultExpanded={['dakp', 'dak']}
      nodes={[
        {
          id: 'dakp',
          label: 'Province ecclésiastique de Dakar',
          children: [
            { id: 'dak', label: 'Archidiocèse de Dakar', meta: '5 doyennés', children: [{ id: 'pm', label: 'Doyenné Plateau-Médina' }] },
            { id: 'thi', label: 'Diocèse de Thiès' },
          ],
        },
      ]}
    />
  );
};

export const Arbre: StoryObj = { render: () => <TreeDemo /> };
