'use client';

import { Flag } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useNotifications } from '@/components/ui/notifications';
import { Textarea } from '@/components/ui/textarea';

import { useReportAlbum } from '../api/report-album';
import {
  MOTIFS_SIGNALEMENT,
  useReportTrack,
  type MotifSignalement,
} from '../api/report-track';
import type { Track } from '../types/schemas';

/** Valeur du choix « tout l'album » dans la liste des cibles. */
const ALBUM_ENTIER = '__album__';

const champ =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

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
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <Flag className="size-4" aria-hidden />
          Signaler un contenu
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Signaler un contenu</DialogTitle>
          <DialogDescription>
            L’équipe de modération de la paroisse examinera votre signalement.
            Merci de votre vigilance.
          </DialogDescription>
        </DialogHeader>
        <form
          id="signaler"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const suite = {
              onSuccess: () => {
                setOuvert(false);
                setCommentaire('');
                useNotifications.getState().addNotification({
                  type: 'success',
                  title: 'Signalement envoyé',
                  message: 'Merci. La paroisse en sera informée.',
                });
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
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Contenu concerné</span>
              <select
                className={champ}
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
              </select>
            </label>
          )}
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Motif</span>
            <select
              className={champ}
              value={motif}
              onChange={(e) => setMotif(e.target.value as MotifSignalement)}
            >
              {MOTIFS_SIGNALEMENT.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <div className="space-y-1.5 text-sm font-medium">
            <label htmlFor="signaler-precisions" className="block">
              Précisions (facultatif)
            </label>
            <Textarea
              id="signaler-precisions"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={3}
            />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="signaler" isLoading={enCours}>
            Envoyer le signalement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
