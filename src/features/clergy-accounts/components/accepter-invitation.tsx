'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-client';

import {
  libelleRole,
  useAccepterInvitation,
  useInvitationParJeton,
} from '../api/clergy-accounts';

const Cadre = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-full max-w-md rounded-16 border border-line bg-paper p-8">
    {children}
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
export function AccepterInvitation({ token }: { token: string }) {
  const { status } = useSession();
  const user = status === 'authenticated';
  const { data: invitation, isLoading, isError } = useInvitationParJeton(token);
  const accepter = useAccepterInvitation();
  const idFichier = useId();
  const [fichier, setFichier] = useState<File | null>(null);

  if (isLoading) {
    return (
      <Cadre>
        <LoadingBlock label="Vérification de l’invitation…" />
      </Cadre>
    );
  }

  if (isError || !invitation) {
    return (
      <Cadre>
        <div className="text-center">
          <Icon name="erreur" size={48} className="mx-auto mb-4 text-err" />
          <h1 className="text-20 font-semibold text-ink">
            Invitation non valable
          </h1>
          <p className="mt-2 text-14 text-ink-3">
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
          <Icon name="succes" size={48} className="mx-auto mb-4 text-ok" />
          <h1 className="text-20 font-semibold text-ink">
            Invitation acceptée
          </h1>
          <p className="mt-2 text-14 text-ink-3">
            Votre compte est en attente de validation par le diocèse. Vous
            recevrez une notification dès qu’il sera ouvert.
          </p>
          <Button asChild block className="mt-6">
            <Link href={paths.app.root.getHref()}>Aller à l’accueil</Link>
          </Button>
        </div>
      </Cadre>
    );
  }

  return (
    <Cadre>
      <h1 className="mb-1 text-20 font-semibold text-ink">
        {invitation.first_name
          ? `Bienvenue, ${invitation.first_name}`
          : 'Invitation reçue'}
      </h1>
      <p className="text-14 text-ink-3">
        Vous êtes invité à rejoindre Jàngu Bi comme <strong>{role}</strong> pour{' '}
        <strong>{invitation.node_name}</strong>.
      </p>
      <p className="mt-1 text-13 text-ink-3">
        Adresse invitée : {invitation.email_masked} · lien valable jusqu’au{' '}
        {new Date(invitation.expires_at).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
        })}
      </p>

      {!user ? (
        <div className="mt-6 space-y-3">
          <p className="text-14 text-ink-3">
            Créez votre compte avec l’adresse invitée, ou connectez-vous si vous
            en avez déjà un, puis revenez sur ce lien.
          </p>
          <Button asChild block>
            <a href={invitation.register_url}>Créer mon compte</a>
          </Button>
          <Button asChild variant="outline" block>
            <Link prefetch={false}
              href={paths.auth.connexion.getHref(
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
              className="mt-3 rounded-md bg-err-bg p-3 text-14 text-err"
            >
              {messageAcceptation(accepter.error)}
            </p>
          )}
          <div className="mt-6 space-y-1">
            <label htmlFor={idFichier} className="text-14 font-medium">
              Pièce justificative (facultatif)
            </label>
            <input
              id={idFichier}
              type="file"
              accept="application/pdf,image/*"
              className="block w-full text-14"
              onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
            />
            <p className="text-13 text-ink-3">
              Lettre de nomination ou attestation, pour aider le diocèse à
              valider votre compte.
            </p>
          </div>
          <Button
            block
            className="mt-6"
            loading={accepter.isPending}
            onClick={() => accepter.mutate({ token, fichier })}
          >
            Accepter l’invitation
          </Button>
        </>
      )}
    </Cadre>
  );
}
