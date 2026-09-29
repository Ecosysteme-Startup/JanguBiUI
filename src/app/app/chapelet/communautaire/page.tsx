'use client';

import { useState } from 'react';

import { FeatureGate } from '@/components/feature-gate';
import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { FEATURES } from '@/config/features';
import type { CommunityRosary } from '@/features/chapelet/api/get-community-rosaries';
import { CommunityRosaryList } from '@/features/chapelet/components/community-rosary-list';

function CommunautaireContent() {
  const [joined, setJoined] = useState<CommunityRosary | null>(null);

  useRegisterPageMeta({
    title: joined ? 'Chapelet en cours' : 'Chapelet communautaire',
  });

  return (
    <div className="flex flex-col">
      {joined ? (
        <ContentContainer width="narrow" className="space-y-4">
          <div className="rounded-xl border border-success/30 bg-success/10 p-4">
            <p className="text-sm font-medium text-success">
              Vous participez au chapelet — décade {joined.current_decade}
            </p>
            {joined.intention && (
              <p className="mt-1 text-sm italic text-muted-foreground">
                {joined.intention}
              </p>
            )}
          </div>
          <button
            className="text-sm text-muted-foreground underline"
            onClick={() => setJoined(null)}
            type="button"
          >
            Revenir à la liste
          </button>
        </ContentContainer>
      ) : (
        <ContentContainer width="narrow" className="overflow-y-auto">
          <CommunityRosaryList onJoin={setJoined} />
        </ContentContainer>
      )}
    </div>
  );
}

/** Chapelet communautaire : `/v1/rosary/community/` gelé en V1 (ADR-006). */
export default function CommunautairePage() {
  return (
    <FeatureGate
      feature={FEATURES.chapeletCommunautaire}
      title="Chapelet communautaire"
      back={{ href: '/app/chapelet', label: 'Revenir au chapelet' }}
    >
      <CommunautaireContent />
    </FeatureGate>
  );
}
