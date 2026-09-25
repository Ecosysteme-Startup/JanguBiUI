import { Notice } from '@/components/ui/notice';

/** 03 — Sécurité du compte : mot de passe, double facteur et appareils se gèrent dans la console Keycloak. */
export const SecuritySection = ({ accountUrl }: { accountUrl: string | null }) => (
  <section aria-labelledby="pf-securite">
    <h2 id="pf-securite" className="tnum m-0 border-t border-line-strong pt-2 text-meta font-normal text-ink-2">
      <span className="text-primary">03</span> — Sécurité du compte
    </h2>
    <p className="m-0 mt-4 text-base font-semibold text-ink">Mot de passe et appareils connectés</p>
    <p className="m-0 mt-1 text-base text-ink-2">
      Gérés par le service de connexion sécurisé : changement de mot de passe, double authentification, sessions ouvertes.
    </p>
    {accountUrl ? (
      <a href={accountUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 font-medium">
        Gérer sur l’espace de connexion
        <span className="sr-only"> (nouvel onglet)</span>
      </a>
    ) : (
      <p className="m-0 mt-3 text-sm text-ink-3">L’espace de connexion n’est pas disponible pour le moment.</p>
    )}
    <Notice title="Échanges avec un prêtre" icon="cadenas" className="mt-6">
      Messages chiffrés · aucun administrateur n’y a accès.
    </Notice>
  </section>
);
