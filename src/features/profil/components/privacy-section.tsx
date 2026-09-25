'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import type { Me } from '@/hooks/use-me';
import { dayjs } from '@/utils/dates';

import { useExportMyData } from '../api/export-data';
import { useGiveConsent } from '../api/give-consent';

import { DeleteAccountDialog } from './delete-account-dialog';

const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** 05 — Confidentialité : consentement, export (JSON) et suppression du compte (loi 2008-12). */
export const PrivacySection = ({ me, onAccountDeleted }: { me: Me; onAccountDeleted: () => void }) => {
  const [deleting, setDeleting] = useState(false);
  const exporter = useExportMyData();
  const consent = useGiveConsent();
  const current = str(me.consent.current_version);
  const givenAt = str(me.consent.given_at);
  const required = me.consent.required === true;

  return (
    <section aria-labelledby="pf-confid">
      <h2 id="pf-confid" className="tnum m-0 border-t border-line-strong pt-2 text-meta font-normal text-ink-2">
        <span className="text-primary">05</span> — Confidentialité
      </h2>
      <div className="mt-4 border-b border-line pb-4">
        <p className="m-0 text-base font-semibold text-ink">Consentement</p>
        {required ? (
          <>
            <p className="m-0 mt-1 text-base text-ink-2">Les conditions d’utilisation ont changé (version {current}). Votre accord est nécessaire.</p>
            <Button size="sm" className="mt-3" disabled={consent.isPending} onClick={() => consent.mutate(current)}>
              J’accepte les conditions
            </Button>
          </>
        ) : (
          <p className="m-0 mt-1 text-base text-ink-2">
            Conditions acceptées{givenAt ? ` le ${dayjs(givenAt).format('D MMMM YYYY')}` : ''} (version {str(me.consent.given_version) || current}).
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-4 border-b border-line py-4">
        <span>
          <span className="block text-base font-semibold text-ink">Exporter mes données</span>
          <span className="block text-sm text-ink-2">Un fichier JSON avec tout ce que Jàngu Bi conserve sur vous.</span>
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={exporter.isPending}
          onClick={() =>
            exporter.mutate(undefined, {
              onSuccess: () => toast.ok('Export téléchargé.'),
              onError: () => toast.err('L’export n’a pas abouti. Réessayez plus tard.'),
            })
          }
        >
          {exporter.isPending ? 'Préparation…' : 'Exporter'}
        </Button>
      </div>
      <div className="flex items-center justify-between gap-4 py-4">
        <span>
          <span className="block text-base font-semibold text-err">Supprimer mon compte</span>
          <span className="block text-sm text-ink-2">Irréversible. Les registres paroissiaux ne sont pas modifiés.</span>
        </span>
        <Button variant="danger" size="sm" onClick={() => setDeleting(true)}>
          Supprimer
        </Button>
      </div>
      <p className="tnum m-0 text-meta text-ink-3">Loi n° 2008-12 sur la protection des données personnelles · CDP</p>
      <DeleteAccountDialog open={deleting} onOpenChange={setDeleting} onDeleted={onAccountDeleted} />
    </section>
  );
};
