'use client';

import { HandHeart, Plus, X } from 'lucide-react';
import { useState } from 'react';

import { FeatureGate } from '@/components/feature-gate';
import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Card } from '@/components/ui/card/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { FEATURES } from '@/config/features';
import { useMyIntentions } from '@/features/intentions/api/get-my-intentions';
import { IntentionStatusBadge } from '@/features/intentions/components/intention-status-badge';
import { SubmitIntentionForm } from '@/features/intentions/components/submit-intention-form';

function IntentionsPageContent() {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, isError, refetch } = useMyIntentions();

  useRegisterPageMeta({ title: 'Intentions de Messe' });

  return (
    <div className="flex flex-col">
      <ContentContainer className="space-y-5">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {showForm ? (
            <>
              <X className="size-4" aria-hidden="true" />
              Annuler
            </>
          ) : (
            <>
              <Plus className="size-4" aria-hidden="true" />
              Nouvelle intention
            </>
          )}
        </button>

        {showForm && (
          <Card className="p-5">
            <SectionHeader title="Nouvelle intention de messe" as="h2" />
            <SubmitIntentionForm onSuccess={() => setShowForm(false)} />
          </Card>
        )}

        {isLoading && <SkeletonList count={3} />}

        {isError && (
          <ErrorState
            title="Impossible de charger vos intentions"
            description="Une erreur est survenue lors du chargement de vos intentions de messe."
            onRetry={() => refetch()}
          />
        )}

        {!isLoading &&
          !isError &&
          data &&
          data.results.length === 0 &&
          !showForm && (
            <EmptyState
              icon={<HandHeart aria-hidden="true" />}
              title="Aucune intention pour le moment"
              description="Vous n'avez pas encore confié d'intention de messe. Créez-en une pour la soumettre à votre paroisse."
            />
          )}

        {!isLoading &&
          !isError &&
          data &&
          data.results.map((intention) => (
            <Card key={intention.id} className="space-y-2 p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="flex-1 text-sm text-foreground">
                  {intention.intention_text}
                </p>
                <IntentionStatusBadge status={intention.status} />
              </div>
              {intention.pretre_email && (
                <p className="text-xs text-muted-foreground">
                  Prêtre : {intention.pretre_email}
                </p>
              )}
              {intention.proposed_date && (
                <p className="text-xs text-muted-foreground">
                  Date proposée :{' '}
                  {new Date(intention.proposed_date).toLocaleDateString(
                    'fr-FR',
                  )}
                </p>
              )}
            </Card>
          ))}
      </ContentContainer>
    </div>
  );
}

/** Route manquante côté backend : écran derrière l'indicateur `intentions`. */
export default function IntentionsPage() {
  return (
    <FeatureGate
      feature={FEATURES.intentions}
      title="Intentions de messe"
      back={{ href: '/app', label: 'Revenir à l’accueil' }}
    >
      <IntentionsPageContent />
    </FeatureGate>
  );
}
