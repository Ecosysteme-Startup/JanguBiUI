import { SegmentedLinks } from '@/components/ui/segmented-control';
import { paths } from '@/config/paths';

/** Sous-navigation de la Parole (FID-Parole) : Du jour · Bible · Chapelet. */
export const ParoleNav = ({ current }: { current: 'jour' | 'bible' | 'chapelet' }) => (
  <SegmentedLinks
    label="La Parole"
    items={[
      { href: paths.app.parole.getHref(), label: 'Du jour', active: current === 'jour' },
      { href: paths.app.bible.root.getHref(), label: 'Bible', active: current === 'bible' },
      { href: paths.app.chapelet.getHref(), label: 'Chapelet', active: current === 'chapelet' },
    ]}
  />
);
