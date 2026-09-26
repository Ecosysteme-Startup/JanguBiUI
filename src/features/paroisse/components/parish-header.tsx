'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/menu';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { nodeAncestorsQueryOptions } from '@/hooks/use-node-ancestors';
import { cn } from '@/utils/cn';
import { parishLabel } from '@/utils/parish-name';

import { useParish } from '../api/get-parish';
import { shareLink } from '../utils/share';

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** « Point E, Dakar · Doyenné Plateau-Médina, archidiocèse de Dakar » */
export const parishSubtitle = (locality: string, jurisdiction: string[]) =>
  [locality, jurisdiction.map((name, i) => (i === 0 ? name : lowerFirst(name))).join(', ')].filter(Boolean).join(' · ');

/** En-tête de « Ma paroisse » : nom, localité et rattachement ; partager, paroisse suivie. */
export const ParishHeader = ({ nodeId, name, className }: { nodeId: string; name: string; className?: string }) => {
  const router = useRouter();
  const { data: parish } = useParish(nodeId);
  const { data: ancestors } = useQuery(nodeAncestorsQueryOptions(nodeId));
  const title = parishLabel(name);
  const locality = [parish?.address, parish?.city].filter(Boolean).join(', ');
  // Le doyenné (s'il existe) puis le diocèse ; à défaut, le parent immédiat.
  const jurisdiction = (ancestors ?? []).filter((a) => a.type?.code === 'doyenne' || a.type?.code === 'diocese');
  const subtitle = parishSubtitle(locality, (jurisdiction.length ? jurisdiction : (ancestors ?? []).slice(-1)).map((a) => a.name));

  const share = async () => {
    const path = parish?.code ? paths.paroisses.detail.getHref(parish.code) : paths.app.paroisse.root.getHref();
    const result = await shareLink({ title, url: `${window.location.origin}${path}` });
    if (result === 'copied') toast.ok('Lien de la paroisse copié.');
    if (result === 'failed') toast.err('Le lien n’a pas pu être partagé.');
  };

  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6', className)}>
      <div className="min-w-0">
        <h1 className="m-0 text-28 font-semibold text-ink sm:text-32">{title}</h1>
        {subtitle && <p className="m-0 mt-2 text-16 text-ink-2">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <IconButton icon="partager" label="Partager la paroisse" bordered onClick={share} className="size-11" />
        <Menu>
          <MenuTrigger
            className="hit inline-flex h-11 items-center gap-2 rounded-12 border border-tint-200 bg-tint-50 px-3.5 text-15 font-semibold text-tint-800 hover:border-line-active"
            aria-label={`Paroisse suivie : ${title}. Options`}
          >
            <Icon name="check" size={18} />
            Paroisse suivie
            <Icon name="chevron-bas" size={16} />
          </MenuTrigger>
          <MenuContent align="end">
            <MenuItem icon="reglages" onSelect={() => router.push(paths.app.profil.getHref())}>
              Changer de paroisse suivie
            </MenuItem>
            {parish?.code && (
              <MenuItem icon="lien-externe" onSelect={() => router.push(paths.paroisses.detail.getHref(parish.code))}>
                Voir la fiche publique
              </MenuItem>
            )}
          </MenuContent>
        </Menu>
      </div>
    </header>
  );
};
