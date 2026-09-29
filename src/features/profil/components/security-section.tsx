import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

import { SettingsCard, SettingsRow } from './settings-card';

/**
 * Sécurité et appareils (FID-Profil) : double authentification, sessions et appareils se gèrent
 * sur l'espace de connexion (Keycloak). Messagerie : ce qui est vrai, pas de chiffrement de bout
 * en bout (ADR-014 reporté).
 */
export const SecuritySection = ({ accountUrl }: { accountUrl: string | null }) => (
  <SettingsCard id="securite" title="Sécurité et appareils">
    <SettingsRow
      title="Appareils connectés et double authentification"
      className="mt-5"
      action={
        accountUrl ? (
          <a href={accountUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline' })}>
            Gérer sur l’espace de connexion
            <Icon name="lien-externe" size={16} />
            <span className="sr-only"> (nouvel onglet)</span>
          </a>
        ) : undefined
      }
    >
      {accountUrl
        ? 'Voyez où votre compte est ouvert et déconnectez un appareil que vous ne reconnaissez pas, puis changez votre mot de passe.'
        : 'L’espace de connexion n’est pas disponible pour le moment.'}
    </SettingsRow>
    <h3 className="m-0 mt-6 border-t border-line pt-5 text-16 font-semibold text-ink">Échanges avec un prêtre</h3>
    <div className="mt-3 flex items-start gap-3.5 rounded-12 border border-line p-4">
      <Icon name="cadenas" size={20} className="mt-0.5 shrink-0 text-ink-2" />
      <span className="flex min-w-0 flex-col">
        <span className="text-15 font-semibold text-ink">Messages chiffrés · aucun administrateur n’y a accès</span>
        <span className="text-14 text-ink-2">
          Ni le secrétariat de la paroisse, ni l’équipe de Jàngu Bi ne lisent vos conversations. Les notifications n’en affichent
          jamais le contenu.
        </span>
      </span>
    </div>
  </SettingsCard>
);
