import type { Metadata } from 'next';

import { FullAgenda } from '@/features/paroisse/components/full-agenda';

export const metadata: Metadata = { title: 'Agenda' };

/** Agenda complet du fidèle : paroisses suivies et nœuds parents, filtre par type, pagination. */
const AgendaPage = () => <FullAgenda />;

export default AgendaPage;
