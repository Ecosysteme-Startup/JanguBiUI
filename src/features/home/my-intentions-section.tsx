'use client';

import { ArrowRight, Plus, ScrollText } from 'lucide-react';
import Link from 'next/link';

import { Card } from '@/components/ui/card/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMesIntentions } from '@/features/intentions/api/intentions';
import { IntentionStatusBadge } from '@/features/intentions/components/intention-status-badge';
import { ligneSuivi } from '@/features/intentions/utils/format';

export function MyIntentionsSection() {
  const { data, isLoading } = useMesIntentions(3);

  const recentIntentions = (data?.results ?? []).slice(0, 3);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">
          <ScrollText className="size-3.5" />
          Mes intentions de messe
        </h2>
        <Link
          href="/app/intentions"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Tout voir
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && recentIntentions.length === 0 && (
        <p className="rounded-xl border border-dashed border-border py-4 text-center text-sm text-muted-foreground">
          Vous n&apos;avez pas encore déposé d&apos;intention.
        </p>
      )}

      {!isLoading &&
        recentIntentions.map((intention) => (
          <Card
            key={intention.id}
            variant="elevated"
            className="flex items-start justify-between gap-3 p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm text-foreground">
                {intention.intention}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {ligneSuivi(intention)}
              </p>
            </div>
            <IntentionStatusBadge status={intention.status} />
          </Card>
        ))}

      <Link
        href="/app/intentions"
        className="flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
      >
        <Plus className="size-4" />
        Déposer une intention
      </Link>
    </section>
  );
}
