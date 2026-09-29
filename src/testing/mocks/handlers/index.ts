import { authHandlers } from './auth';
import { bibleHandlers } from './bible';
import { documentsHandlers } from './documents';
import { donsAnalyseHandlers } from './dons-analyse';
import { messagingHandlers } from './messaging';
import { newsHandlers } from './news';
import { notificationsHandlers } from './notifications';
import { sonothequeHandlers } from './sonotheque';

export const handlers = [
  ...authHandlers,
  ...documentsHandlers,
  ...messagingHandlers,
  ...notificationsHandlers,
  ...newsHandlers,
  ...bibleHandlers,
  ...donsAnalyseHandlers,
  ...sonothequeHandlers,
];
