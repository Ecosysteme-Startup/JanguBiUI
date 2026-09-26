'use client';

import { useEffect, useState } from 'react';

import { useSignOut } from '@/components/layouts/sign-out-button';
import { Icon, type IconName } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

export const PROFILE_SECTIONS: { id: string; label: string; icon: IconName }[] = [
  { id: 'compte', label: 'Compte', icon: 'profil' },
  { id: 'paroisse', label: 'Paroisse suivie', icon: 'paroisse' },
  { id: 'notifications', label: 'Notifications', icon: 'cloche' },
  { id: 'apparence', label: 'Apparence', icon: 'clair' },
  { id: 'securite', label: 'Sécurité et appareils', icon: 'bouclier' },
  { id: 'confidentialite', label: 'Confidentialité', icon: 'oeil' },
  { id: 'etat-de-vie', label: 'Mon état de vie', icon: 'document' },
];

const itemClass = 'flex min-h-11 items-center gap-3 rounded-10 px-3 text-15 transition-colors hover:no-underline lg:min-h-10';

/**
 * Onglets de réglages (FID-Profil) : ancres vers les cartes de la page, section courante suivie
 * au défilement. Sous lg, une rangée défilante au-dessus des cartes.
 */
export const ProfileNav = () => {
  const [current, setCurrent] = useState(PROFILE_SECTIONS[0].id);
  const { signOut, pending } = useSignOut();

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setCurrent(visible.target.id);
      },
      { rootMargin: '0px 0px -60% 0px' },
    );
    PROFILE_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="Réglages" className="min-w-0 lg:sticky lg:top-6">
      <ul className="m-0 flex list-none gap-0.5 overflow-x-auto p-0 lg:flex-col lg:overflow-visible">
        {PROFILE_SECTIONS.map((section) => {
          const active = section.id === current;
          return (
            <li key={section.id} className="shrink-0">
              <a
                href={`#${section.id}`}
                aria-current={active ? 'true' : undefined}
                onClick={() => setCurrent(section.id)}
                className={cn(itemClass, active ? 'bg-tint-50 font-semibold text-tint-800 hover:text-tint-800' : 'text-ink-2 hover:bg-surface-2 hover:text-ink')}
              >
                <Icon name={section.icon} size={18} className="shrink-0" />
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
      <div className="mx-3 my-3 hidden h-px bg-line lg:block" />
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        className={cn(itemClass, 'mt-3 w-full font-medium text-err hover:bg-err-bg hover:text-err disabled:opacity-60 lg:mt-0')}
      >
        <Icon name="deconnexion" size={18} className="shrink-0" />
        {pending ? 'Déconnexion…' : 'Se déconnecter'}
      </button>
      <p className="m-0 mx-3 mt-4 hidden text-12 leading-[18px] text-ink-3 lg:block">
        Jàngu Bi, édité par Numerisen
      </p>
    </nav>
  );
};
