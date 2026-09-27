'use client';

import { TopbarContent } from '@/components/layouts/shell-slots';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { paths } from '@/config/paths';

/** Barre supérieure des sous-pages : « ‹ Dons et quêtes / <page> ». */
export const DonsTopbar = ({
  nodeId,
  current,
}: {
  nodeId: string;
  current: string;
}) => (
  <TopbarContent
    start={
      <Breadcrumbs
        back
        separator="slash"
        items={[
          {
            label: 'Dons et quêtes',
            href: paths.espace.dons.root.getHref(nodeId),
          },
          { label: current },
        ]}
      />
    }
  />
);
