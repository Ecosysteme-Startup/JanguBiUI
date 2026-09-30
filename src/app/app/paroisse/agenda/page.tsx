import type { Metadata } from 'next';

import { FullAgenda } from '@/features/paroisse/components/full-agenda';

export const metadata: Metadata = { title: 'Agenda' };

/** Agenda complet de la paroisse suivie par le fidèle : filtre par type, pagination. */
const AgendaPage = () => <FullAgenda />;

export default AgendaPage;
