'use client';

import { BookOpen, ScrollText } from 'lucide-react';
import Link from 'next/link';

import { ContentContainer } from '@/components/layouts/content-container';
import { FideleSummarySection } from '@/features/dashboard/components/fidele-summary-section';
import { PastoralReflectionWidget } from '@/features/reflexion-pastorale/components/pastoral-reflection-widget';
import { Stagger, StaggerItem } from '@/lib/motion/reveal';
import { cn } from '@/utils/cn';

import { MyIntentionsSection } from './my-intentions-section';
import { ParishEventsSection } from './parish-events-section';
import { ParishNewsSection } from './parish-news-section';
import { WelcomeBanner } from './welcome-banner';

const QUICK_ACTIONS = [
  {
    label: 'Spirituel',
    href: '/app/spirituel',
    icon: BookOpen,
    className: 'bg-primary/10 text-primary',
  },
  {
    label: 'Intentions',
    href: '/app/intentions',
    icon: ScrollText,
    className: 'bg-accent/15 text-accent',
  },
  //{
  //  label: 'Assistant',
  //  href: '/app/assistant',
  //  icon: MessageCircle,
  //  className: 'bg-info/10 text-info',
  //},
] as const;

export function FideleDashboard() {
  return (
    <ContentContainer width="wide">
      {/* Cartes révélées en cascade douce (450 ms, +8 px, 70 ms d'écart). */}
      <Stagger appear className="flex flex-col gap-6">
        <StaggerItem>
          <WelcomeBanner />
        </StaggerItem>

        {/* Quick actions */}
        <StaggerItem className="grid grid-cols-2 gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 shadow-soft-sm transition-all hover:-translate-y-0.5 hover:shadow-soft active:scale-[0.97] motion-reduce:transform-none"
              >
                <div
                  className={cn(
                    'flex size-10 items-center justify-center rounded-xl',
                    action.className,
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <span className="text-center text-[11px] font-medium leading-tight text-foreground">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </StaggerItem>

        {/* Résumé (stats) — pleine largeur */}
        <StaggerItem>
          <FideleSummarySection />
        </StaggerItem>

        {/* Bento : contenu principal (2/3) + colonne latérale (1/3) en desktop */}
        <div className="grid gap-6 lg:grid-cols-3">
          <StaggerItem className="flex flex-col gap-6 lg:col-span-2">
            <ParishNewsSection />
            <ParishEventsSection />
          </StaggerItem>
          <StaggerItem className="flex flex-col gap-6">
            <PastoralReflectionWidget />
            <MyIntentionsSection />
          </StaggerItem>
        </div>
      </Stagger>
    </ContentContainer>
  );
}
