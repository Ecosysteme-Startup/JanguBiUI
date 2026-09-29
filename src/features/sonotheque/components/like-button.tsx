'use client';

import { Heart } from 'lucide-react';
import { motion } from 'motion/react';

import { pressProps } from '@/lib/motion/press-scale';
import { useMotionOK } from '@/lib/motion/use-motion-ok';
import { cn } from '@/utils/cn';

import { useToggleLike } from '../api/toggle-like';

export function LikeButton({
  trackId,
  titre,
  liked,
  className,
}: {
  trackId: string;
  titre: string;
  liked: boolean;
  className?: string;
}) {
  const ok = useMotionOK();
  const like = useToggleLike();
  const etat = like.isPending ? !liked : liked;
  return (
    <motion.button
      type="button"
      {...pressProps(ok)}
      aria-pressed={etat}
      aria-label={
        etat ? `Retirer « ${titre} » des titres aimés` : `Aimer « ${titre} »`
      }
      onClick={(e) => {
        e.stopPropagation();
        like.mutate({ trackId, liked: !liked });
      }}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink',
        etat && 'text-primary',
        className,
      )}
    >
      <Heart className={cn('size-4', etat && 'fill-current')} aria-hidden />
    </motion.button>
  );
}
