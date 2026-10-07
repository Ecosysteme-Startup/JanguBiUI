import { env } from '@/config/env';
import { cn } from '@/utils/cn';

type StoreKey = 'apple' | 'google';

/** Libellés des badges officiels en français : « Télécharger dans / l’App Store », « Disponible sur / Google Play ». */
type Store = {
  key: StoreKey;
  kicker: string;
  name: string;
  label: string;
  url: string | undefined;
};

const STORES: Store[] = [
  {
    key: 'apple',
    kicker: 'Télécharger dans',
    name: 'l’App Store',
    label: 'Télécharger dans l’App Store',
    url: env.APP_STORE_URL,
  },
  {
    key: 'google',
    kicker: 'Disponible sur',
    name: 'Google Play',
    label: 'Disponible sur Google Play',
    url: env.PLAY_STORE_URL,
  },
];

/** Logo Apple (Simple Icons, CC0), couleur du texte du badge. */
const AppleLogo = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="size-7 shrink-0 fill-current"
  >
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </svg>
);

/** Triangle Google Play (Simple Icons, CC0) dans ses quatre couleurs. */
const GooglePlayLogo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6 shrink-0">
    <path
      fill="#4285F4"
      d="M1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924z"
    />
    <path
      fill="#34A853"
      d="M13.544 10.989l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973z"
    />
    <path
      fill="#FBBC04"
      d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594z"
    />
    <path
      fill="#EA4335"
      d="M13.544 13.056l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z"
    />
  </svg>
);

const BADGE =
  'inline-flex h-14 min-w-0 items-center justify-center gap-3 rounded-12 px-3 transition-transform sm:min-w-[172px] sm:justify-start sm:px-4';

// Badges sombres dans les deux thèmes, comme ceux des boutiques : le bleu nuit de la marque (`night`,
// qui ne s'inverse pas, contrairement à `ink`) ; en sombre, un liseré les détache du fond.
const BADGE_OFFICIEL = 'bg-night text-lit-white dark:ring-1 dark:ring-line';

const StoreBadge = ({ store }: { store: Store }) => {
  const content = (
    <>
      {store.key === 'apple' ? <AppleLogo /> : <GooglePlayLogo />}
      <span className="flex flex-col items-start text-left leading-none">
        <span className="text-12 font-normal opacity-85">
          {store.url ? store.kicker : 'Bientôt sur'}
        </span>
        <span className="mt-1 text-18 font-semibold tracking-[-0.01em]">
          {store.name}
        </span>
      </span>
    </>
  );
  if (!store.url) {
    return (
      <span
        className={cn(
          BADGE,
          'cursor-default border border-line bg-surface text-ink-3',
        )}
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
      aria-label={`${store.label} (nouvelle fenêtre)`}
      className={cn(
        BADGE,
        BADGE_OFFICIEL,
        'shadow-menu hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:hover:-translate-y-0.5',
      )}
    >
      {content}
    </a>
  );
};

/**
 * Badges App Store et Google Play, dans l'ouverture de l'accueil (ancre `#application`, cible du
 * lien « Application mobile » du pied de page). Liens réglés par NEXT_PUBLIC_APP_STORE_URL et
 * NEXT_PUBLIC_PLAY_STORE_URL ; sans lien configuré, « Bientôt sur … » non cliquable.
 */
export const StoreBadges = ({ className }: { className?: string }) => (
  <div
    id="application"
    aria-label="Application mobile"
    className={cn(
      'grid scroll-mt-24 grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center',
      className,
    )}
  >
    {STORES.map((store) => (
      <StoreBadge key={store.key} store={store} />
    ))}
  </div>
);
