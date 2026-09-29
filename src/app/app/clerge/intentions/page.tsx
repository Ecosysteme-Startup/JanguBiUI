'use client';

import { Inbox } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { SansRoute } from '@/components/staff/sans-route';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { SkeletonList } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useParishIntentions } from '@/features/intentions/api/get-parish-intentions';
import {
  useAcceptIntention,
  useCelebrateIntention,
  useDeclineIntention,
  useProposeDate,
} from '@/features/intentions/api/manage-intentions';
import { IntentionStatusBadge } from '@/features/intentions/components/intention-status-badge';
import { useUser } from '@/lib/auth';
import { isClergy } from '@/lib/authorization';

function ClergeIntentionsPageContenu() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();
  const { data, isLoading, isError, refetch } = useParishIntentions();
  const { mutate: accept, isPending: accepting } = useAcceptIntention();
  const { mutate: celebrate, isPending: celebrating } = useCelebrateIntention();
  const { mutate: decline, isPending: declining } = useDeclineIntention();
  const { mutate: proposeDate, isPending: proposingDate } = useProposeDate();
  const [proposingDateFor, setProposingDateFor] = useState<number | null>(null);
  const [dateInput, setDateInput] = useState('');

  useEffect(() => {
    if (!userLoading && !isClergy(user)) {
      router.replace(paths.app.root.getHref());
    }
  }, [user, userLoading, router]);

  useRegisterPageMeta({ title: 'Intentions reçues' });

  if (userLoading || !isClergy(user)) return null;

  return (
    <div className="flex flex-col">
      <ContentContainer className="space-y-4">
        {isLoading && <SkeletonList count={4} />}

        {isError && (
          <ErrorState
            title="Impossible de charger les intentions"
            description="Une erreur est survenue lors du chargement des intentions de votre paroisse."
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && data && data.results.length === 0 && (
          <EmptyState
            icon={<Inbox aria-hidden="true" />}
            title="Aucune intention en attente"
            description="Les intentions de messe soumises par les fidèles de votre paroisse apparaîtront ici."
          />
        )}

        {!isLoading &&
          !isError &&
          data &&
          data.results.map((intention) => (
            <Card key={intention.id} className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-foreground">
                    {intention.intention_text}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    De : {intention.requestor_email}
                  </p>
                  {intention.parish_name && (
                    <p className="text-xs text-muted-foreground">
                      Paroisse : {intention.parish_name}
                    </p>
                  )}
                </div>
                <IntentionStatusBadge status={intention.status} />
              </div>

              <div className="flex flex-wrap gap-2">
                {intention.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => accept(intention.id)}
                      disabled={accepting}
                      isLoading={accepting}
                    >
                      Accepter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decline({ intentionId: intention.id })}
                      disabled={declining}
                      isLoading={declining}
                    >
                      Refuser
                    </Button>
                  </>
                )}
                {(intention.status === 'accepted' ||
                  intention.status === 'date_proposed') && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => celebrate(intention.id)}
                      disabled={celebrating}
                      isLoading={celebrating}
                    >
                      Marquer célébrée
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setProposingDateFor(intention.id);
                        setDateInput('');
                      }}
                    >
                      Proposer une date
                    </Button>
                  </>
                )}
              </div>

              {proposingDateFor === intention.id && (
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    htmlFor={`propose-date-${intention.id}`}
                    className="sr-only"
                  >
                    Date proposée
                  </label>
                  <Input
                    id={`propose-date-${intention.id}`}
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="w-auto"
                  />
                  <Button
                    size="sm"
                    disabled={!dateInput || proposingDate}
                    isLoading={proposingDate}
                    onClick={() => {
                      if (dateInput) {
                        proposeDate(
                          {
                            intentionId: intention.id,
                            proposed_date: dateInput,
                          },
                          { onSuccess: () => setProposingDateFor(null) },
                        );
                      }
                    }}
                  >
                    Confirmer
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setProposingDateFor(null)}
                  >
                    Annuler
                  </Button>
                </div>
              )}
            </Card>
          ))}
      </ContentContainer>
    </div>
  );
}

export default function ClergeIntentionsPage() {
  return (
    <SansRoute cle="intentionsMesse" titre="Intentions de messe">
      <ClergeIntentionsPageContenu />
    </SansRoute>
  );
}
