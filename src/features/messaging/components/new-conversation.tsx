'use client';

import { ArrowLeft, Loader2, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';

import { useAcceptMessagingCgu, useMessagingCgu } from '../api/cgu';
import { useCreateConversation } from '../api/create-conversation';
import {
  acceptsNewConversations,
  type Priest,
  usePriests,
} from '../api/get-priests';

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function PriestsSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-border">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PriestRow({
  priest,
  onSelect,
}: {
  priest: Priest;
  onSelect: (priest: Priest) => void;
}) {
  const disponible = acceptsNewConversations(priest);
  const lieu = [priest.office?.label, priest.nodes[0]?.name]
    .filter(Boolean)
    .join(' · ');
  return (
    <button
      type="button"
      onClick={() => onSelect(priest)}
      disabled={!disponible}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Avatar className="size-11 shrink-0">
        <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
          {getInitials(priest.full_name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">
          {priest.full_name}
        </p>
        {lieu && (
          <p className="truncate text-xs text-muted-foreground">{lieu}</p>
        )}
        {priest.availability?.note && (
          <p className="truncate text-xs text-muted-foreground">
            {priest.availability.note}
          </p>
        )}
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
          disponible
            ? 'bg-success/10 text-success'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {disponible ? 'Disponible' : 'Indisponible'}
      </span>
    </button>
  );
}

/** Refus de création d'un échange (codes V1 de apps/messaging). */
const messageCreation = (code: string | null): string => {
  switch (code) {
    case 'birth_date_required':
      return 'Renseignez votre date de naissance dans votre profil pour écrire à un prêtre.';
    case 'minor':
      return 'La messagerie avec un prêtre est réservée aux personnes majeures. Rapprochez-vous de votre paroisse.';
    case 'not_reachable':
      return 'Ce prêtre n’est pas joignable par la messagerie.';
    case 'not_accepting':
      return 'Ce prêtre ne prend pas de nouveaux échanges pour le moment.';
    default:
      return 'L’échange n’a pas pu être ouvert. Réessayez dans quelques instants.';
  }
};

function CguMessagerie() {
  const accepter = useAcceptMessagingCgu();
  return (
    <div className="m-4 space-y-3 rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">
        Avant d’écrire à un prêtre
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li>
          La messagerie sert à l’accompagnement et aux questions pratiques ;
          elle ne remplace pas la confession.
        </li>
        <li>
          Le prêtre répond selon ses disponibilités ; il peut clore un échange.
        </li>
        <li>
          Les échanges sont conservés pour une durée limitée puis supprimés.
        </li>
      </ul>
      <Button onClick={() => accepter.mutate()} isLoading={accepter.isPending}>
        J’ai compris et j’accepte
      </Button>
    </div>
  );
}

export function NewConversation() {
  const router = useRouter();
  const cgu = useMessagingCgu();
  const { data: priests, isLoading, isError } = usePriests();
  const [erreur, setErreur] = useState<string | null>(null);
  const { mutate: createConversation, isPending } = useCreateConversation({
    onSuccess: (conv) => {
      router.push(`/app/messages/${conv.id}`);
    },
  });

  function handleSelect(priest: Priest) {
    if (!acceptsNewConversations(priest) || isPending) return;
    setErreur(null);
    createConversation(
      { priest_user_id: priest.user_id },
      {
        onError: (err) =>
          setErreur(messageCreation(err instanceof ApiError ? err.code : null)),
      },
    );
  }

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full hover:bg-muted"
          aria-label="Retour"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <span className="text-sm font-semibold text-foreground">
            Nouvelle conversation
          </span>
          <p className="text-xs text-muted-foreground">Choisissez un prêtre</p>
        </div>
        {isPending && (
          <Loader2 className="ml-auto size-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {cgu.data && !cgu.data.accepted && <CguMessagerie />}

      {erreur && (
        <p
          role="alert"
          className="mx-4 mt-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {erreur}
        </p>
      )}

      {isLoading && <PriestsSkeleton />}

      {isError && (
        <p className="py-10 text-center text-sm text-destructive">
          Impossible de charger la liste des prêtres.
        </p>
      )}

      {!isLoading && !isError && !priests?.length && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MessageCircle className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Aucun prêtre joignable dans vos paroisses pour le moment.
          </p>
        </div>
      )}

      {!isLoading && !isError && !!priests?.length && cgu.data?.accepted && (
        <div className="flex flex-col divide-y divide-border">
          {priests.map((priest) => (
            <PriestRow
              key={priest.user_id}
              priest={priest}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
