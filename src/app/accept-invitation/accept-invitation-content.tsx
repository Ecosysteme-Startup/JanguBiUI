'use client';

import { CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import {
  libelleRole,
  useAccepterInvitation,
  useInvitationParJeton,
} from '@/features/clergy-accounts/api/clergy-accounts';
import { ApiError } from '@/lib/api-client';
import { useUser } from '@/lib/auth';

const Cadre = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen items-center justify-center bg-background p-4">
    <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
      {children}
    </div>
  </div>
);

const messageAcceptation = (e: unknown) => {
  if (e instanceof ApiError && e.code === 'invitation_email_mismatch')
    return 'Vous êtes connecté avec une autre adresse que celle de l’invitation. Déconnectez-vous puis reconnectez-vous avec l’adresse invitée.';
  if (e instanceof ApiError && e.code?.startsWith('file_'))
    return 'La pièce jointe n’a pas pu être prise en compte. Réessayez de la déposer, ou acceptez sans pièce.';
  if (e instanceof ApiError && e.status === 410)
    return 'Ce lien d’invitation n’est plus valable. Demandez une nouvelle invitation.';
  return e instanceof ApiError ? e.message : 'L’acceptation n’a pas abouti.';
};

/**
 * Page d'acceptation d'une invitation du clergé (`/accept-invitation?token=`).
 * Le jeton est vérifié (`POST …/validate/`), puis accepté une fois connecté
 * avec l'adresse invitée (`POST …/accept/`) : le compte passe « en attente ».
 */
export function AcceptInvitationContent({ token }: { token: string }) {
  const { data: user } = useUser();
  const { data: invitation, isLoading, isError } = useInvitationParJeton(token);
  const accepter = useAccepterInvitation();
  const idFichier = useId();
  const [fichier, setFichier] = useState<File | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !invitation) {
    return (
      <Cadre>
        <div className="text-center">
          <XCircle
            className="mx-auto mb-4 size-12 text-destructive"
            aria-hidden="true"
          />
          <h1 className="text-xl font-bold text-foreground">
            Invitation non valable
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ce lien a expiré, a été révoqué ou a déjà servi. Demandez une
            nouvelle invitation au diocèse.
          </p>
        </div>
      </Cadre>
    );
  }

  const role = libelleRole(invitation.etat_de_vie, invitation.degre_ordre);

  if (accepter.isSuccess) {
    return (
      <Cadre>
        <div className="text-center">
          <CheckCircle
            className="mx-auto mb-4 size-12 text-success"
            aria-hidden="true"
          />
          <h1 className="text-xl font-bold text-foreground">
            Invitation acceptée
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre compte est en attente de validation par le diocèse. Vous
            recevrez une notification dès qu’il sera ouvert.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link href={paths.app.root.getHref()}>Aller à l’accueil</Link>
          </Button>
        </div>
      </Cadre>
    );
  }

  return (
    <Cadre>
      <h1 className="mb-1 text-xl font-bold text-foreground">
        {invitation.first_name
          ? `Bienvenue, ${invitation.first_name}`
          : 'Invitation reçue'}
      </h1>
      <p className="text-sm text-muted-foreground">
        Vous êtes invité à rejoindre Jàngu Bi comme <strong>{role}</strong> pour{' '}
        <strong>{invitation.node_name}</strong>.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Adresse invitée : {invitation.email_masked} · lien valable jusqu’au{' '}
        {new Date(invitation.expires_at).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
        })}
      </p>

      {!user ? (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Créez votre compte avec l’adresse invitée, ou connectez-vous si vous
            en avez déjà un, puis revenez sur ce lien.
          </p>
          <Button asChild className="w-full">
            <a href={invitation.register_url}>Créer mon compte</a>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link
              href={paths.auth.login.getHref(
                paths.acceptInvitation.getHref(token),
              )}
            >
              Se connecter
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {accepter.isError && (
            <p
              role="alert"
              className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              {messageAcceptation(accepter.error)}
            </p>
          )}
          <div className="mt-6 space-y-1">
            <label htmlFor={idFichier} className="text-sm font-medium">
              Pièce justificative (facultatif)
            </label>
            <input
              id={idFichier}
              type="file"
              accept="application/pdf,image/*"
              className="block w-full text-sm"
              onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Lettre de nomination ou attestation, pour aider le diocèse à
              valider votre compte.
            </p>
          </div>
          <Button
            className="mt-6 w-full"
            isLoading={accepter.isPending}
            onClick={() => accepter.mutate({ token, fichier })}
          >
            Accepter l’invitation
          </Button>
        </>
      )}
    </Cadre>
  );
}
