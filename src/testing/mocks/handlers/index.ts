import { adminComptesHandlers } from './admin-comptes';
import { agendaHandlers } from './agenda';
import { audioLecteurHandlers } from './audio-lecteur';
import { authHandlers } from './auth';
import { bibleHandlers } from './bible';
import { confessionsHandlers } from './confessions';
import { documentsHandlers } from './documents';
import { donsHandlers } from './dons';
import { donsAnalyseHandlers } from './dons-analyse';
import { messagingHandlers } from './messaging';
import { newsHandlers } from './news';
import { notificationsHandlers } from './notifications';
import { paroissesHandlers } from './paroisses';
import { sonothequeHandlers } from './sonotheque';
import { staffHandlers } from './staff';
import { staffDonsHandlers } from './staff-dons';
import { staffStructureHandlers } from './staff-structure';
import { v1ComplementsHandlers } from './v1-complements';

export const handlers = [
  ...authHandlers,
  ...documentsHandlers,
  ...messagingHandlers,
  ...notificationsHandlers,
  ...newsHandlers,
  ...bibleHandlers,
  ...donsHandlers,
  ...donsAnalyseHandlers,
  ...audioLecteurHandlers,
  ...sonothequeHandlers,
  ...paroissesHandlers,
  ...agendaHandlers,
  ...confessionsHandlers,
  ...staffHandlers,
  ...staffDonsHandlers,
  ...staffStructureHandlers,
  ...v1ComplementsHandlers,
  ...adminComptesHandlers,
];
