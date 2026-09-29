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

import {
  MOTIFS_SIGNALEMENT,
  useReportTrack,
  type MotifSignalement,
} from '../api/report-track';
import type { Track } from '../types/schemas';

const champ =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

/** « Signaler un contenu » (règles de l'Église, spec C2 §1). */
export function SignalerDialog({ pistes }: { pistes: Track[] }) {
  const [ouvert, setOuvert] = useState(false);
  const [pisteId, setPisteId] = useState(pistes[0]?.id ?? '');
  const [motif, setMotif] = useState<MotifSignalement>('droits');
  const [commentaire, setCommentaire] = useState('');
  const report = useReportTrack();
  if (!pistes.length) return null;
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
            report.mutate(
              {
                trackId: pisteId || pistes[0].id,
                motif,
                comment: commentaire.trim(),
              },
              {
                onSuccess: () => {
                  setOuvert(false);
                  setCommentaire('');
                  useNotifications.getState().addNotification({
                    type: 'success',
                    title: 'Signalement envoyé',
                    message: 'Merci. La paroisse en sera informée.',
                  });
                },
              },
            );
          }}
        >
          {pistes.length > 1 && (
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Enregistrement concerné</span>
              <select
                className={champ}
                value={pisteId}
                onChange={(e) => setPisteId(e.target.value)}
              >
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
          <Button type="submit" form="signaler" isLoading={report.isPending}>
            Envoyer le signalement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
