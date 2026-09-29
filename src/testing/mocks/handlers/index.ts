import { audioLecteurHandlers } from './audio-lecteur';
import { authHandlers } from './auth';
import { bibleHandlers } from './bible';
import { documentsHandlers } from './documents';
import { donsAnalyseHandlers } from './dons-analyse';
import { messagingHandlers } from './messaging';
import { newsHandlers } from './news';
import { notificationsHandlers } from './notifications';
import { paroissesHandlers } from './paroisses';
import { sonothequeHandlers } from './sonotheque';
import { staffHandlers } from './staff';

export const handlers = [
  ...authHandlers,
  ...documentsHandlers,
  ...messagingHandlers,
  ...notificationsHandlers,
  ...newsHandlers,
  ...bibleHandlers,
  ...donsAnalyseHandlers,
  ...audioLecteurHandlers,
  ...sonothequeHandlers,
  ...paroissesHandlers,
  ...staffHandlers,
];
