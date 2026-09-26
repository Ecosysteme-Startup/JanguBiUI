'use client';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { toast } from '@/components/ui/toast';

import { shareLink } from '../utils/share';

const useShare = (title: string) => async () => {
  const result = await shareLink({ title, url: window.location.href });
  if (result === 'copied') toast.ok('Lien copié : vous pouvez le coller dans un message.');
  if (result === 'failed') toast.err('Le lien n’a pas pu être partagé.');
};

/** Partage de la page courante : feuille de partage native, sinon copie du lien. */
export const ShareButton = ({ title, label }: { title: string; label: string }) => {
  const share = useShare(title);
  return (
    <Button variant="outline" onClick={share} className="h-11">
      <Icon name="partager" size={18} />
      {label}
    </Button>
  );
};

export const ShareIconButton = ({ title, label, bordered = false }: { title: string; label: string; bordered?: boolean }) => {
  const share = useShare(title);
  return <IconButton icon="partager" label={label} bordered={bordered} onClick={share} className={bordered ? 'size-11' : 'text-ink-2'} />;
};
