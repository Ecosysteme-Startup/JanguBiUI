import { paths } from '@/config/paths';

/** Chapelet d'un autre jour (`?jour=0` = lundi) ; `null` : les mystères du jour. */
export const chapeletHref = (weekday: number | null) =>
  weekday === null ? paths.app.chapelet.getHref() : `${paths.app.chapelet.getHref()}?jour=${weekday}`;
