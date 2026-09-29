'use client';

import DOMPurify from 'isomorphic-dompurify';
import { BookOpen } from 'lucide-react';

import { Card } from '@/components/ui/card/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';

import { OfficeKey, useOffice } from '../../api/get-office';

const safe = (html: string) => DOMPurify.sanitize(html);

interface OfficeViewProps {
  officeKey: OfficeKey;
}

export function OfficeView({ officeKey }: OfficeViewProps) {
  const { data: office, isLoading, isError, error } = useOffice(officeKey);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError) {
    const isAuthError =
      error instanceof ApiError &&
      (error.status === 401 || error.status === 403);
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="font-medium text-destructive">
          {isAuthError
            ? 'Accès réservé au clergé et aux religieux.'
            : 'Impossible de charger cet office. Veuillez réessayer.'}
        </p>
      </div>
    );
  }

  if (!office) return null;

  const psaumes = office.psalms.map((p) => {
    const bloc = p.psaume;
    if (typeof bloc === 'string') return { antienne: p.antienne, texte: bloc };
    return {
      antienne: p.antienne,
      reference: bloc?.reference,
      titre: bloc?.titre,
      texte: bloc?.texte ?? '',
    };
  });

  return (
    <div className="space-y-6">
      {office.hymn && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <BookOpen className="size-4" />
            Hymne
          </h3>
          <Card
            variant="elevated"
            className="prose prose-sm max-w-none p-4 text-foreground"
            dangerouslySetInnerHTML={{ __html: safe(office.hymn) }}
          />
        </section>
      )}

      {psaumes.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <BookOpen className="size-4" />
            Psaumes
          </h3>
          <div className="space-y-3">
            {psaumes.map((psaume, i) => (
              <Card key={i} variant="elevated" className="p-4">
                {(psaume.reference || psaume.titre) && (
                  <p className="mb-2 text-xs font-medium text-primary">
                    {[psaume.reference, psaume.titre]
                      .filter(Boolean)
                      .join(' — ')}
                  </p>
                )}
                {psaume.antienne && (
                  <div
                    className="prose prose-sm mb-2 max-w-none italic text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: safe(psaume.antienne) }}
                  />
                )}
                <div
                  className="prose prose-sm max-w-none text-foreground"
                  dangerouslySetInnerHTML={{ __html: safe(psaume.texte) }}
                />
              </Card>
            ))}
          </div>
        </section>
      )}

      {office.readings.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Parole de Dieu
          </h3>
          <div className="space-y-3">
            {office.readings.map((lecture, i) => (
              <Card key={i} variant="elevated" className="p-4">
                {(lecture.titre || lecture.reference) && (
                  <p className="mb-2 text-xs font-medium text-primary">
                    {[lecture.titre, lecture.reference]
                      .filter(Boolean)
                      .join(' — ')}
                  </p>
                )}
                <div
                  className="prose prose-sm max-w-none text-foreground"
                  dangerouslySetInnerHTML={{
                    __html: safe(lecture.texte ?? ''),
                  }}
                />
              </Card>
            ))}
          </div>
        </section>
      )}

      {office.canticle && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Cantique
          </h3>
          <div
            className="prose prose-sm max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: safe(office.canticle) }}
          />
        </section>
      )}

      {office.intercessions && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Intercessions
          </h3>
          <div
            className="prose prose-sm max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: safe(office.intercessions) }}
          />
        </section>
      )}
    </div>
  );
}
