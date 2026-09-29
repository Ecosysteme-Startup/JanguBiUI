import { EmptyState } from '@/components/ui/empty-state';

/** Affiché sans la capacité `actes.traiter` sur ce nœud (le serveur refuserait de toute façon). */
export const CapabilityDenied = () => (
  <EmptyState icon="cadenas" title="Accès réservé au traitement des actes.">
    Cette page demande la capacité « traiter les demandes d’actes » sur cette paroisse. Rapprochez-vous du curé si elle vous manque.
  </EmptyState>
);
