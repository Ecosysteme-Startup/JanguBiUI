'use client';

import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';

import { FEATURES, isFeatureEnabled } from '@/config/features';
import { cn } from '@/lib/utils';

const regularLinks = [
  {
    label: 'Bible',
    description: 'Ancien & Nouveau Testament',
    href: '/app/bible?tab=bible',
    icon: BookOpen,
    iconClass: 'bg-primary/10 text-primary',
    borderClass: 'border-t-primary/40',
  },
  {
    label: 'Calendrier',
    description: 'Fêtes et temps liturgiques',
    href: '/app/bible?tab=heures',
    icon: Calendar,
    iconClass: 'bg-warning/10 text-warning',
    borderClass: 'border-t-warning/40',
  },
  {
    label: 'Liturgie',
    description: 'Offices du jour',
    href: '/app/bible?tab=heures',
    icon: Clock,
    iconClass: 'bg-info/10 text-info',
    borderClass: 'border-t-info/40',
  },
] as const;

export function QuickAccessGrid() {
  return (
    <section aria-label="Accès rapide" className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        Accès rapide
      </h2>

      {/* Regular 2×2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {regularLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                'group flex flex-col gap-3 rounded-2xl border border-t-2 border-border bg-card p-4',
                'transition-all hover:-translate-y-0.5 hover:shadow-md',
                link.borderClass,
              )}
            >
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105',
                  link.iconClass,
                )}
              >
                <Icon className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">
                  {link.label}
                </span>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {link.description}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Assistant : route `/v1/rag/` manquante → derrière l'indicateur. */}
      {isFeatureEnabled(FEATURES.assistant) && (
        <Link
          href="/app/assistant"
          className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-gold/5 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
        >
          <div className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-primary/5" />
          <div className="pointer-events-none absolute bottom-0 right-8 size-14 rounded-full bg-gold/5" />

          <div className="relative flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/20 transition-transform group-hover:scale-105">
              <MessageCircle className="size-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-foreground">
                Assistant spirituel
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Posez vos questions sur la Bible, le chapelet ou trouvez un
                prêtre
              </span>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
        </Link>
      )}
    </section>
  );
}
