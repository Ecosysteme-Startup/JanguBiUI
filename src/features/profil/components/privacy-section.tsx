'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { toast } from '@/components/ui/toast';
import type { Me } from '@/hooks/use-me';
import { dayjs } from '@/utils/dates';

import { useExportMyData } from '../api/export-data';
import { useGiveConsent } from '../api/give-consent';

import { DeleteAccountDialog } from './delete-account-dialog';
import { SettingsCard, SettingsRow } from './settings-card';

const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** Confidentialité : consentement et export (JSON) des données (loi 2008-12). */
export const PrivacySection = ({ me }: { me: Me }) => {
  const exporter = useExportMyData();
  const consent = useGiveConsent();
  const current = str(me.consent.current_version);
  const givenAt = str(me.consent.given_at);
  const required = me.consent.required === true;

  return (
    <SettingsCard id="confidentialite" title="Confidentialité" description="Loi n° 2008-12 sur la protection des données personnelles · CDP.">
      <SettingsRow
        title="Conditions d’utilisation"
        className="mt-5"
        action={
          required ? (
            <Button disabled={consent.isPending} onClick={() => consent.mutate(current)}>
              J’accepte les conditions
            </Button>
          ) : undefined
        }
      >
        {required
          ? `Les conditions d’utilisation ont changé (version ${current}). Votre accord est nécessaire.`
          : `Conditions acceptées${givenAt ? ` le ${dayjs(givenAt).format('D MMMM YYYY')}` : ''} (version ${str(me.consent.given_version) || current}).`}
      </SettingsRow>
      <SettingsRow
        title="Exporter mes données"
        className="mt-5 border-t border-line pt-5"
        action={
          <Button
            variant="outline"
            disabled={exporter.isPending}
            onClick={() =>
              exporter.mutate(undefined, {
                onSuccess: () => toast.ok('Export téléchargé.'),
                onError: () => toast.err('L’export n’a pas abouti. Réessayez plus tard.'),
              })
            }
          >
            <Icon name="export" size={18} />
            {exporter.isPending ? 'Préparation…' : 'Exporter'}
          </Button>
        }
      >
        Un fichier JSON avec tout ce que Jàngu Bi conserve sur vous.
      </SettingsRow>
    </SettingsCard>
  );
};

/** Supprimer mon compte (FID-Profil) : carte à part, confirmation forte dans une fenêtre. */
export const DeleteAccountSection = ({ onAccountDeleted }: { onAccountDeleted: () => void }) => {
  const [deleting, setDeleting] = useState(false);
  return (
    <section
      id="suppression"
      aria-labelledby="suppression-titre"
      className="flex scroll-mt-6 flex-col items-start justify-between gap-4 rounded-16 border border-line bg-paper px-5 py-6 sm:flex-row sm:gap-6 sm:px-8"
    >
      <div className="min-w-0">
        <h2 id="suppression-titre" className="m-0 text-18 font-semibold text-err">
          Supprimer mon compte
        </h2>
        <p className="m-0 mt-1 text-14 text-ink-2">
          Vos conversations avec les prêtres sont effacées, vos demandes d’actes anonymisées. Les actes eux-mêmes restent inscrits aux
          registres paroissiaux, qui ne dépendent pas de Jàngu Bi.
        </p>
      </div>
      <Button variant="outline" className="min-h-11 border-err-line text-err hover:border-err-line hover:bg-err-bg hover:text-err" onClick={() => setDeleting(true)}>
        <Icon name="corbeille" size={18} />
        Supprimer mon compte
      </Button>
      <DeleteAccountDialog open={deleting} onOpenChange={setDeleting} onDeleted={onAccountDeleted} />
    </section>
  );
};
