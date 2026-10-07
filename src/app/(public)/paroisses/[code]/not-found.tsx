import type { Metadata } from 'next';

import { NotFoundScreen } from '@/components/errors/not-found-screen';

export const metadata: Metadata = { title: 'Page introuvable', robots: { index: false } };

/**
 * 404 d'une fiche paroisse inconnue (JB-WEB-003) : on ne rend QUE l'écran 404, la coquille
 * publique étant déjà fournie par le layout du groupe `(public)`. Un seul en-tête, « Page
 * introuvable », identique à la 404 générale (contrairement à l'ancien double en-tête
 * « Fiche paroisse »).
 */
const FicheParoisseNotFound = () => <NotFoundScreen />;

export default FicheParoisseNotFound;
