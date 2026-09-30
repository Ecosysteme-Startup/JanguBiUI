import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { env } from '@/config/env';
import { Reveal } from '@/lib/motion/reveal';
import { cn } from '@/utils/cn';

type Store = { name: string; prefix: string; url: string | undefined };

const STORES: Store[] = [
  { name: 'App Store', prefix: 'Télécharger dans l’', url: env.APP_STORE_URL },
  { name: 'Google Play', prefix: 'Disponible sur ', url: env.PLAY_STORE_URL },
];

const StoreButton = ({ store }: { store: Store }) => {
  const content = (
    <>
      <Icon name="mobile" size={22} className="shrink-0" />
      <span className="flex flex-col items-start text-left leading-tight">
        <span className="text-12 font-normal">{store.url ? store.prefix.trim() : 'Bientôt sur'}</span>
        <span className="text-16 font-semibold">{store.name}</span>
      </span>
    </>
  );
  if (!store.url) {
    return (
      <span
        className={cn(buttonVariants({ variant: 'outline', size: 'xl' }), 'cursor-default gap-3 text-ink-3 hover:bg-paper hover:text-ink-3')}
      >
        {content}
      </span>
    );
  }
  return (
    <a
      href={store.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ variant: 'outline', size: 'xl' }), 'gap-3 motion-safe:hover:-translate-y-0.5')}
      aria-label={`${store.prefix}${store.name} (nouvelle fenêtre)`}
    >
      {content}
    </a>
  );
};

/**
 * Application mobile (ancre `#application`, lien « Application mobile » du pied de page) :
 * boutons vers l'App Store et Google Play, réglés par NEXT_PUBLIC_APP_STORE_URL et
 * NEXT_PUBLIC_PLAY_STORE_URL ; sans lien configuré, « Bientôt sur … » non cliquable.
 */
export const HomeApp = () => (
  <section id="application" aria-labelledby="application-titre" className="jb-container scroll-mt-24 pt-16 md:pt-24">
    <Reveal className="flex flex-col gap-8 rounded-16 border border-line bg-surface p-6 md:flex-row md:items-center md:justify-between md:p-14">
      <div className="max-w-xl">
        <p className="m-0 text-15 font-semibold text-primary">Application mobile</p>
        <h2 id="application-titre" className="m-0 mt-2 text-28 font-semibold text-ink md:text-32">
          Jàngu Bi dans votre poche
        </h2>
        <p className="m-0 mt-4 text-17 leading-7 text-ink-2">
          La Parole du jour, les annonces de votre paroisse et vos demandes, sur iPhone et Android. Même compte que sur le web.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {STORES.map((store) => (
          <StoreButton key={store.name} store={store} />
        ))}
      </div>
    </Reveal>
  </section>
);
