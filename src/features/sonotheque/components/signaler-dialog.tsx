'use client';

import { Flag } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';

import { useReportAlbum } from '../api/report-album';
import {
  MOTIFS_SIGNALEMENT,
  useReportTrack,
  type MotifSignalement,
} from '../api/report-track';
import type { Track } from '../types/schemas';

/** Valeur du choix « tout l'album » dans la liste des cibles. */
const ALBUM_ENTIER = '__album__';

/**
 * « Signaler un contenu » (règles de l'Église, spec C2 §1). Sur la page d'un
 * album, on peut signaler l'album entier (pochette, présentation, ensemble
 * des pistes : `POST audio/albums/<id>/signaler/`) ou une seule piste.
 */
export function SignalerDialog({
  pistes,
  album,
}: {
  pistes: Track[];
  album?: { id: string; title: string } | null;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [cible, setCible] = useState(
    album ? ALBUM_ENTIER : (pistes[0]?.id ?? ''),
  );
  const [motif, setMotif] = useState<MotifSignalement>('droits');
  const [commentaire, setCommentaire] = useState('');
  const reportPiste = useReportTrack();
  const reportAlbum = useReportAlbum();
  if (!pistes.length && !album) return null;
  const surAlbum = !!album && (cible === ALBUM_ENTIER || !pistes.length);
  const enCours = reportPiste.isPending || reportAlbum.isPending;
  const choixCible = pistes.length > 1 || (!!album && pistes.length > 0);
  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="inline-flex items-center gap-1.5 text-14 font-medium text-ink-3 hover:text-ink"
      >
        <Flag className="size-4" aria-hidden />
        Signaler un contenu
      </button>
      <Modal
        open={ouvert}
        onOpenChange={setOuvert}
        title="Signaler un contenu"
        description="L’équipe de modération de la paroisse examinera votre signalement. Merci de votre vigilance."
        footer={
          <Button type="submit" form="signaler" loading={enCours}>
            Envoyer le signalement
          </Button>
        }
      >
        <form
          id="signaler"
          className="flex flex-col gap-4 pb-1"
          onSubmit={(e) => {
            e.preventDefault();
            const suite = {
              onSuccess: () => {
                setOuvert(false);
                setCommentaire('');
                toast.ok(
                  'Signalement envoyé. Merci, la paroisse en sera informée.',
                );
              },
            };
            const corps = { motif, comment: commentaire.trim() };
            if (surAlbum && album) {
              reportAlbum.mutate({ albumId: album.id, ...corps }, suite);
            } else {
              const trackId =
                cible && cible !== ALBUM_ENTIER ? cible : pistes[0].id;
              reportPiste.mutate({ trackId, ...corps }, suite);
            }
          }}
        >
          {choixCible && (
            <Field id="signaler-cible" label="Contenu concerné">
              <Select
                controlSize="sm"
                value={cible}
                onChange={(e) => setCible(e.target.value)}
              >
                {album && (
                  <option value={ALBUM_ENTIER}>
                    {`Tout l’album « ${album.title} »`}
                  </option>
                )}
                {pistes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field id="signaler-motif" label="Motif">
            <Select
              controlSize="sm"
              value={motif}
              onChange={(e) => setMotif(e.target.value as MotifSignalement)}
            >
              {MOTIFS_SIGNALEMENT.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="signaler-precisions" label="Précisions" optional>
            <Textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={3}
            />
          </Field>
          {(reportPiste.error || reportAlbum.error) && (
            <p role="alert" className="m-0 text-14 text-err">
              {(reportPiste.error ?? reportAlbum.error)?.message}
            </p>
          )}
        </form>
      </Modal>
    </>
  );
}
