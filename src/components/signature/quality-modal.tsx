'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

import { type OfficeQuality, OfficeQualityField } from './office-quality-field';

type QualityModalProps = {
  /** « Abbé Augustin Ndiaye · Saint-Dominique » */
  subject: string;
  qualities: OfficeQuality[];
  current: string;
  pending: boolean;
  error?: string;
  onSubmit: (quality: string) => void;
  onClose: () => void;
};

/**
 * « Modifier la qualité » d'une nomination en cours (ex. l'administrateur paroissial devient curé).
 * L'appel et ses invalidations restent dans la feature appelante.
 */
export const QualityModal = ({ subject, qualities, current, pending, error, onSubmit, onClose }: QualityModalProps) => {
  const [quality, setQuality] = React.useState(current || qualities[0]?.code || '');
  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title="Modifier la qualité"
      description={`${subject}. Le titre affiché partout change ; les capacités de l’office restent les mêmes.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={pending || !quality || quality === current} onClick={() => onSubmit(quality)}>
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </>
      }
    >
      <OfficeQualityField
        id="modifier-qualite"
        name="modifier-qualite"
        qualities={qualities}
        checkedValue={quality}
        onValueChange={setQuality}
      />
      {error && (
        <p role="alert" className="m-0 mt-3 text-sm text-err">
          {error}
        </p>
      )}
    </Modal>
  );
};
