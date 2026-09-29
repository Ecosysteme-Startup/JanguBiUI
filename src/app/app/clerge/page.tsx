'use client';

import { BookOpen, Clock, Cross, MapPin, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import {
  type Fonctionnalite,
  fonctionnaliteActive,
} from '@/config/fonctionnalites';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';
import { isClergy } from '@/lib/authorization';
import { type Capacite, aCapacite } from '@/lib/staff/capacites';
import { cn } from '@/lib/utils';

type Section = {
  href: string;
  icon: typeof Cross;
  label: string;
  description: string;
  color: string;
  /** Écran sans route V1 : masqué tant que l'indicateur est éteint. */
  sansRoute?: Fonctionnalite;
  /** Capacité requise (sur au moins un nœud). */
  capacite?: Capacite;
};

const CLERGE_SECTIONS: Section[] = [
  {
    capacite: 'intentions.gerer',
    href: paths.app.paroisse.intentions.getHref(),
    icon: Cross,
    label: 'Intentions de messe',
    description: 'Recevoir · Planifier · Célébrer',
    color: 'bg-warning/10 text-warning',
  },
  {
    sansRoute: 'messagerieClericale',
    href: paths.app.clerge.messages.getHref(),
    icon: MessageSquare,
    label: 'Messagerie inter-clergé',
    description: 'Correspondance · Annonces · Directives',
    color: 'bg-info/10 text-info',
  },
  {
    sansRoute: 'transferts',
    href: paths.app.clerge.transferts.getHref(),
    icon: MapPin,
    label: 'Transferts paroissiaux',
    description: 'Gérer les demandes de changement de paroisse',
    color: 'bg-success/10 text-success',
  },
  {
    href: paths.app.spirituelHeures.getHref(),
    icon: Clock,
    label: 'Liturgie des Heures',
    description: 'Laudes · Vêpres · Complies · 7 offices',
    color: 'bg-accent/15 text-accent',
  },
  {
    href: paths.app.spirituel.getHref(),
    icon: BookOpen,
    label: 'Spiritualité',
    description: 'Bible · Chapelet · Liturgie du jour',
    color: 'bg-primary/10 text-primary',
  },
];

export default function ClergePage() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && !isClergy(user)) {
      router.replace('/app');
    }
  }, [user, isLoading, router]);

  useRegisterPageMeta({
    title: 'Espace Clergé',
    subtitle: 'Outils et ressources pastoraux',
  });

  if (isLoading || !isClergy(user)) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <ContentContainer>
        <div className="flex flex-col gap-3">
          {CLERGE_SECTIONS.filter(
            (s) =>
              (!s.sansRoute || fonctionnaliteActive(s.sansRoute)) &&
              (!s.capacite || aCapacite(user, s.capacite)),
          ).map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted active:scale-[0.98]"
              >
                <div
                  className={cn(
                    'flex size-12 flex-shrink-0 items-center justify-center rounded-xl',
                    section.color,
                  )}
                >
                  <Icon className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">
                    {section.label}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </div>
                <svg
                  className="size-4 shrink-0 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            );
          })}
        </div>
      </ContentContainer>
    </div>
  );
}
